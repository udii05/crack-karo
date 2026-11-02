"""Encrypted bring-your-own-key provider vault."""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.orm import Session

from .ai import AIProviderError, get_provider
from .ai.gemini_provider import GeminiProvider
from .ai.openai_provider import OpenAIProvider
from .config import settings
from .models import ProviderKey, User

PROVIDERS = {
    "gemini": {
        "label": "Google Gemini",
        "models": ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"],
        "capabilities": ["text"],
        "default_model": "gemini-3.1-flash-lite",
    },
    "openai": {
        "label": "OpenAI",
        "models": ["gpt-4o-mini", "gpt-4o"],
        "capabilities": ["text"],
        "default_model": "gpt-4o-mini",
    },
}


def _fernet() -> Fernet:
    material = settings.key_encryption_key or settings.secret_key
    digest = hashlib.sha256(material.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_key(api_key: str) -> str:
    return _fernet().encrypt(api_key.encode("utf-8")).decode("utf-8")


def decrypt_key(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError) as exc:
        raise AIProviderError(
            "Your saved provider key could not be decrypted. Reconnect your provider."
        ) from exc


def mask_key(value: str) -> str:
    if len(value) <= 4:
        return "****"
    return f"****{value[-4:]}"


def provider_statuses(db: Session, user: User) -> list[dict]:
    saved = {
        row.provider: row
        for row in db.query(ProviderKey).filter(ProviderKey.user_id == user.id).all()
    }
    result = []
    for name, config in PROVIDERS.items():
        row = saved.get(name)
        result.append(
            {
                "provider": name,
                "label": config["label"],
                "models": config["models"],
                "capabilities": config["capabilities"],
                "default_model": config["default_model"],
                "configured": row is not None,
                "key_hint": row.key_hint if row else "",
                "model": row.model if row else config["default_model"],
            }
        )
    return result


def _build_provider(name: str, api_key: str, model: str):
    if name == "gemini":
        return GeminiProvider(api_key=api_key, model=model or PROVIDERS[name]["default_model"])
    if name == "openai":
        return OpenAIProvider(api_key=api_key, model=model or PROVIDERS[name]["default_model"])
    raise AIProviderError(f"Unsupported provider: {name}")


def test_provider_key(name: str, api_key: str, model: str) -> tuple[bool, str]:
    try:
        provider = _build_provider(name, api_key, model)
        provider.generate_question("behavioral", "beginner", [])
        return True, "Connection successful."
    except Exception as exc:
        return False, str(exc) or "Provider test failed."


def save_provider_key(
    db: Session, user: User, name: str, api_key: str, model: str
) -> ProviderKey:
    if name not in PROVIDERS:
        raise AIProviderError("Unsupported provider")

    row = (
        db.query(ProviderKey)
        .filter(ProviderKey.user_id == user.id, ProviderKey.provider == name)
        .first()
    )
    provided_key = api_key.strip()
    if not provided_key and not row:
        raise AIProviderError("API key is required for a new provider.")
    test_key = provided_key or decrypt_key(row.encrypted_key)
    test_ok, message = test_provider_key(name, test_key, model)
    if not test_ok:
        raise AIProviderError(message)

    if row:
        if provided_key:
            row.encrypted_key = encrypt_key(provided_key)
            row.key_hint = mask_key(provided_key)
        row.model = model or PROVIDERS[name]["default_model"]
    else:
        row = ProviderKey(
            user_id=user.id,
            provider=name,
            encrypted_key=encrypt_key(provided_key),
            key_hint=mask_key(provided_key),
            model=model or PROVIDERS[name]["default_model"],
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_provider_key(db: Session, user: User, name: str) -> bool:
    row = (
        db.query(ProviderKey)
        .filter(ProviderKey.user_id == user.id, ProviderKey.provider == name)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def get_user_provider(db: Session, user: User):
    """Return the user's encrypted BYOK provider, then the platform fallback."""
    rows = (
        db.query(ProviderKey)
        .filter(ProviderKey.user_id == user.id)
        .all()
    )
    by_name = {row.provider: row for row in rows}
    for name in ("gemini", "openai"):
        row = by_name.get(name)
        if row:
            return _build_provider(name, decrypt_key(row.encrypted_key), row.model)
    return get_provider()

