"""Application configuration via environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Interview Copilot"
    secret_key: str = "dev-secret-change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h
    database_url: str = "sqlite:///./data/copilot.db"
    frontend_origin: str = "http://localhost:3000"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    environment: str = "development"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: str = ""
    access_token_cookie: str = "copilot_access"
    csrf_cookie: str = "copilot_csrf"
    key_encryption_key: str = ""
    redis_url: str = ""
    sentry_dsn: str = ""
    rate_limit_per_minute: int = 120
    auth_rate_limit_per_minute: int = 10
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    admin_emails: str = (
        "udita.chakraborty05@gmail.com,asmita.chakrab@gmail.com"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()


