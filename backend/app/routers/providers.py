from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..byok import (
    PROVIDERS,
    delete_provider_key,
    provider_statuses,
    save_provider_key,
    test_provider_key,
)
from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import ProviderKeyIn, ProviderStatusOut, ProviderTestOut

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("", response_model=list[ProviderStatusOut])
def list_providers(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return provider_statuses(db, user)


@router.put("/{provider}", response_model=ProviderStatusOut)
def save_provider(
    provider: str,
    payload: ProviderKeyIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail="Provider not supported")
    try:
        save_provider_key(db, user, provider, payload.api_key.strip(), payload.model)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return next(
        item for item in provider_statuses(db, user) if item["provider"] == provider
    )


@router.post("/{provider}/test", response_model=ProviderTestOut)
def test_provider(
    provider: str,
    payload: ProviderKeyIn,
    user: User = Depends(get_current_user),
):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail="Provider not supported")
    if not payload.api_key.strip():
        raise HTTPException(status_code=400, detail="Enter an API key to test.")
    ok, message = test_provider_key(provider, payload.api_key.strip(), payload.model)
    return ProviderTestOut(ok=ok, message=message)


@router.delete("/{provider}", status_code=204)
def remove_provider(
    provider: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail="Provider not supported")
    if not delete_provider_key(db, user, provider):
        raise HTTPException(status_code=404, detail="Provider key not configured")
    return None

