from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..byok import get_user_provider
from ..database import get_db
from ..deps import get_current_user
from ..models import CopilotSession, User
from ..schemas import CopilotOut, CopilotRequest

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


@router.post("/hint", response_model=CopilotOut)
def get_hint(
    payload: CopilotRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    provider = get_user_provider(db, user)
    result = provider.copilot_hint(payload.context, payload.transcript)
    db.add(CopilotSession(user_id=user.id, status="active"))
    db.commit()
    return CopilotOut(**result)
