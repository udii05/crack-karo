"""Pluggable AI provider interface.

Gemini is preferred when GEMINI_API_KEY is configured, then OpenAI when
OPENAI_API_KEY is configured. Without either key the app uses the local
deterministic mock provider so it still works offline.
"""
from typing import Protocol

from ..config import settings


class AIProvider(Protocol):
    def generate_question(self, category: str, difficulty: str, skills: list[str]) -> dict: ...

    def score_answer(self, question: str, answer: str, category: str) -> dict: ...

    def extract_skills(self, text: str) -> list[str]: ...

    def analyze_job(self, title: str, description: str) -> dict: ...

    def copilot_hint(self, context: str, transcript: str) -> dict: ...

    def coach_reply(self, context: str, question: str, history: str = "") -> str: ...

    def skill_recommendations(self, role: str, context: str) -> dict: ...


_provider: AIProvider | None = None


def get_provider_name() -> str:
    if settings.gemini_api_key:
        return "gemini"
    if settings.openai_api_key:
        return "openai"
    return "mock"


def get_provider() -> AIProvider:
    global _provider
    if _provider is None:
        if settings.gemini_api_key:
            from .gemini_provider import GeminiProvider

            _provider = GeminiProvider(
                api_key=settings.gemini_api_key, model=settings.gemini_model
            )
        elif settings.openai_api_key:
            from .openai_provider import OpenAIProvider

            _provider = OpenAIProvider(
                api_key=settings.openai_api_key, model=settings.openai_model
            )
        else:
            from .mock import MockProvider

            _provider = MockProvider()
    return _provider
