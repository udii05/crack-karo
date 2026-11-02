"""Google Gemini provider.

Uses the Gemini REST API directly so the app has no extra SDK dependency.
The API key stays on the backend; it is never exposed to the browser.
"""
import json
import logging
import re
import time
import urllib.error
import urllib.request
from typing import Any

from .errors import AIProviderError

logger = logging.getLogger(__name__)

DIMENSIONS = ("relevance", "structure", "technical", "delivery")


class GeminiProvider:
    def __init__(self, api_key: str, model: str = "gemini-3.5-flash"):
        if not api_key:
            raise ValueError("Gemini API key is required")
        self.api_key = api_key
        self.model = model
        self.url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )

    # ------------------------------------------------------------------
    # Transport
    # ------------------------------------------------------------------
    def _generate(
        self,
        system: str,
        user: str,
        *,
        temperature: float = 0.6,
        max_output_tokens: int = 2048,
        json_mode: bool = True,
    ) -> str:
        generation_config = {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        }
        if json_mode:
            generation_config["responseMimeType"] = "application/json"
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": generation_config,
        }
        request = urllib.request.Request(
            self.url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.api_key,
            },
            method="POST",
        )

        body = None
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=60) as response:
                    body = response.read().decode("utf-8")
                break
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")
                logger.warning("Gemini HTTP %s: %s", exc.code, detail[:500])
                last_error = exc
                if exc.code in (429, 503) and attempt < 2:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise AIProviderError(
                    "Gemini is temporarily unavailable or rejected the request. Try again, or connect your own Gemini key in Settings."
                ) from exc
            except (urllib.error.URLError, TimeoutError) as exc:
                logger.warning("Gemini connection error: %s", exc)
                last_error = exc
                if attempt < 2:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise AIProviderError(
                    "Could not reach Gemini. Check your network connection and try again."
                ) from exc

        if body is None:
            raise AIProviderError(
                "Gemini request failed after retries."
            ) from last_error

        try:
            data = json.loads(body)
        except json.JSONDecodeError as exc:
            raise AIProviderError("Gemini returned an unreadable response.") from exc

        block_reason = data.get("promptFeedback", {}).get("blockReason")
        if block_reason:
            raise AIProviderError(f"Gemini blocked the request ({block_reason}).")

        try:
            parts = data["candidates"][0]["content"]["parts"]
            text = "".join(part.get("text", "") for part in parts).strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise AIProviderError("Gemini returned an unexpected response.") from exc

        if not text:
            raise AIProviderError("Gemini returned an empty response.")
        return text

    def _generate_json(
        self,
        system: str,
        user: str,
        *,
        temperature: float = 0.6,
        max_output_tokens: int = 2048,
    ) -> Any:
        return self._parse_json(
            self._generate(
                system,
                user,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )
        )

    @staticmethod
    def _parse_json(text: str) -> Any:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(
                r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE
            )
            cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Some models wrap JSON in prose despite JSON mode. Try the obvious
        # object/array spans before giving up.
        for opener, closer in (("{", "}"), ("[", "]")):
            start = cleaned.find(opener)
            end = cleaned.rfind(closer)
            if start == -1 or end <= start:
                continue
            try:
                return json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                continue

        raise AIProviderError("Gemini returned invalid JSON.")

    # ------------------------------------------------------------------
    # Normalization helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _score(value: Any, default: float = 0.0) -> float:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return default
        return max(0.0, min(100.0, round(number, 1)))

    @staticmethod
    def _string_list(value: Any, limit: int) -> list[str]:
        if not isinstance(value, list):
            return []
        items: list[str] = []
        seen: set[str] = set()
        for item in value:
            text = str(item).strip()
            if not text:
                continue
            key = text.lower()
            if key in seen:
                continue
            seen.add(key)
            items.append(text)
            if len(items) >= limit:
                break
        return items

    # ------------------------------------------------------------------
    # AIProvider interface
    # ------------------------------------------------------------------
    def generate_question(
        self, category: str, difficulty: str, skills: list[str]
    ) -> dict:
        raw = self._generate_json(
            "You are an expert interviewer. Return only a JSON object with keys "
            "'body' (one interview question) and 'hint' (one short hint). Do not "
            "include markdown or extra keys.",
            f"Interview type: {category}\n"
            f"Difficulty: {difficulty}\n"
            f"Candidate skills: {', '.join(skills) or 'general'}\n"
            "Ask one realistic question that fits the type and difficulty.",
            temperature=0.7,
            max_output_tokens=2048,
        )
        if not isinstance(raw, dict):
            raise AIProviderError("Gemini returned an invalid question payload.")
        body = str(raw.get("body") or "").strip()
        hint = str(raw.get("hint") or "").strip()
        if not body:
            raise AIProviderError("Gemini did not return a question.")
        return {"body": body, "hint": hint}

    def score_answer(self, question: str, answer: str, category: str) -> dict:
        raw = self._generate_json(
            "You are a strict but fair interview coach. Evaluate the candidate's "
            "answer and return only a JSON object with these keys: "
            "'score' (number 0-100), 'summary' (2 sentences), 'dimensions' "
            "(object with relevance, structure, technical, delivery, each 0-100), "
            "and 'weaknesses' (array of 1-3 specific, actionable strings). "
            "For behavioral questions, judge STAR structure and concrete outcomes. "
            "For technical questions, judge accuracy, depth, and trade-offs. "
            "Do not include markdown or extra keys.",
            f"Interview type: {category}\n"
            f"Question: {question}\n"
            f"Candidate answer: {answer}",
            temperature=0.2,
            max_output_tokens=2048,
        )
        if not isinstance(raw, dict):
            raise AIProviderError("Gemini returned an invalid scoring payload.")

        raw_overall = self._score(raw.get("score"), 0.0)
        dimensions_raw = raw.get("dimensions")
        if not isinstance(dimensions_raw, dict):
            dimensions_raw = {}

        dimensions = {
            key: self._score(dimensions_raw.get(key), raw_overall)
            for key in DIMENSIONS
        }

        if raw_overall == 0 and any(dimensions.values()):
            overall = round(
                0.35 * dimensions["relevance"]
                + 0.25 * dimensions["structure"]
                + 0.25 * dimensions["technical"]
                + 0.15 * dimensions["delivery"],
                1,
            )
        else:
            overall = raw_overall

        summary = str(raw.get("summary") or "").strip()
        if not summary:
            summary = "The AI returned a score without a written summary."

        return {
            "score": overall,
            "summary": summary,
            "dimensions": dimensions,
            "weaknesses": self._string_list(raw.get("weaknesses"), 3),
        }

    def extract_skills(self, text: str) -> list[str]:
        raw = self._generate_json(
            "Extract the professional and technical skills from this resume. "
            "Return only a JSON array of short skill names. Do not include "
            "soft claims, sentences, or markdown.",
            text[:12000],
            temperature=0.1,
            max_output_tokens=2048,
        )
        if not isinstance(raw, list):
            raise AIProviderError("Gemini returned an invalid skills payload.")
        return self._string_list(raw, 30)

    def analyze_job(self, title: str, description: str) -> dict:
        raw = self._generate_json(
            "You are a career advisor. Return only a JSON object with keys "
            "'skills' (array of short skill names) and 'likely_questions' "
            "(array of realistic interview questions). Do not include markdown.",
            f"Job title: {title}\nJob description:\n{description[:8000]}",
            temperature=0.4,
            max_output_tokens=2048,
        )
        if not isinstance(raw, dict):
            raise AIProviderError("Gemini returned an invalid job payload.")
        return {
            "skills": self._string_list(raw.get("skills"), 20),
            "likely_questions": self._string_list(raw.get("likely_questions"), 10),
        }

    def coach_reply(self, context: str, question: str, history: str = "") -> str:
        return self._generate(
            "You are a concise, supportive interview coach. Use the candidate's "
            "actual performance data when relevant. Give specific, actionable advice "
            "and avoid generic encouragement. Return plain text, not JSON.",
            f"Performance context:\n{context}\n\n"
            f"Conversation so far:\n{history or 'None'}\n\n"
            f"Candidate question: {question}",
            temperature=0.4,
            max_output_tokens=2048,
            json_mode=False,
        )

    def skill_recommendations(self, role: str, context: str) -> dict:
        raw = self._generate_json(
            "You are a senior technical interview coach. Return only a JSON object "
            "with keys: 'summary' (string), 'focus_areas' (array of objects with "
            "'skill', 'why', 'topics' (3-5 specific study topics), and 'action' "
            "(one concrete practice step)), and 'study_plan' (3-5 ordered steps). "
            "Prioritise missing role requirements and low self-ratings. Recommend "
            "specific topics, concepts, and exercises - never generic phrases like "
            "'strengthen X'. Do not recommend communication; that is assessed through "
            "interviews. Do not include markdown.",
            f"Role: {role}\n{context}",
            temperature=0.5,
            max_output_tokens=2048,
        )
        if not isinstance(raw, dict):
            raise AIProviderError("Gemini returned an invalid recommendations payload.")
        return raw

    def copilot_hint(self, context: str, transcript: str) -> dict:
        raw = self._generate_json(
            "You are a discreet interview copilot. Given the interview context "
            "and the question the interviewer just asked, return only a JSON "
            "object with keys 'suggestion' (string), 'talking_points' (array of "
            "strings), and 'star_outline' (object with Situation, Task, Action, "
            "Result strings). Do not include markdown.",
            f"Context: {context or 'Not provided'}\n"
            f"Interviewer question: {transcript or 'Not provided'}",
            temperature=0.5,
            max_output_tokens=2048,
        )
        if not isinstance(raw, dict):
            raise AIProviderError("Gemini returned an invalid copilot payload.")

        star_raw = raw.get("star_outline")
        star_outline: dict[str, str] = {}
        if isinstance(star_raw, dict):
            star_outline = {
                str(key): str(value)
                for key, value in star_raw.items()
                if str(value).strip()
            }

        return {
            "suggestion": str(raw.get("suggestion") or "").strip(),
            "talking_points": self._string_list(raw.get("talking_points"), 8),
            "star_outline": star_outline,
        }

