"""Optional OpenAI-compatible provider.

Used when OPENAI_API_KEY is set. Uses the `requests`-free approach via
the standard library urllib to avoid extra dependencies.
"""
import json
import urllib.request


class OpenAIProvider:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model
        self.url = "https://api.openai.com/v1/chat/completions"

    def _chat(self, system: str, user: str, temperature: float = 0.6) -> str:
        body = json.dumps(
            {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": temperature,
            }
        ).encode()
        req = urllib.request.Request(
            self.url,
            data=body,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
        return data["choices"][0]["message"]["content"].strip()

    def generate_question(self, category: str, difficulty: str, skills: list[str]) -> dict:
        content = self._chat(
            "You are an expert technical interviewer. Return only a JSON object with keys body and hint.",
            f"Ask one {category} interview question ({difficulty} difficulty) "
            f"tailored to skills: {', '.join(skills) or 'general'}. Include a short hint.",
        )
        try:
            parsed = json.loads(content)
            return {"body": parsed.get("body", ""), "hint": parsed.get("hint", "")}
        except json.JSONDecodeError:
            return {"body": content, "hint": ""}

    def score_answer(self, question: str, answer: str, category: str) -> dict:
        content = self._chat(
            "You are an interview coach. Score the answer 0-100 on relevance, structure, "
            "technical accuracy, and delivery. Return JSON with keys score, summary, "
            "dimensions (object), weaknesses (array).",
            f"Question: {question}\nAnswer: {answer}",
            temperature=0.3,
        )
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"score": 60, "summary": content, "dimensions": {}, "weaknesses": []}

    def extract_skills(self, text: str) -> list[str]:
        content = self._chat(
            "Extract a list of skills from the resume text. Return a JSON array of strings.",
            text[:4000],
            temperature=0.2,
        )
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return []

    def analyze_job(self, title: str, description: str) -> dict:
        content = self._chat(
            "You are a career advisor. Given a job title and description, return JSON with "
            "keys skills (array) and likely_questions (array).",
            f"Title: {title}\nDescription: {description[:4000]}",
        )
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"skills": [], "likely_questions": []}

    def coach_reply(self, context: str, question: str, history: str = "") -> str:
        return self._chat(
            "You are a concise, supportive interview coach. Use the candidate's "
            "actual performance data when relevant. Give specific, actionable advice "
            "and avoid generic encouragement.",
            f"Performance context:\n{context}\n\n"
            f"Conversation so far:\n{history or 'None'}\n\n"
            f"Candidate question: {question}",
            temperature=0.4,
        )

    def skill_recommendations(self, role: str, context: str) -> dict:
        content = self._chat(
            "You are a senior technical interview coach. Return only JSON with keys "
            "summary, focus_areas (array of objects with skill, why, topics, action), "
            "and study_plan (array). Recommend specific study topics, not generic "
            "'strengthen X' advice. Do not include communication.",
            f"Role: {role}\n{context}",
            temperature=0.5,
        )
        try:
            parsed = json.loads(content)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    def copilot_hint(self, context: str, transcript: str) -> dict:
        content = self._chat(
            "You are a discreet interview copilot. Given interview context and the live "
            "question, return JSON with keys suggestion, talking_points (array), "
            "star_outline (object).",
            f"Context: {context}\nLive question: {transcript}",
            temperature=0.7,
        )
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"suggestion": content, "talking_points": [], "star_outline": {}}
