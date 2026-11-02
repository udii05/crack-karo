from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..byok import get_user_provider
from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import CoachChatOut, CoachChatRequest
from ..services.coach import performance_context

router = APIRouter(prefix="/api/coach", tags=["coach"])


@router.post("/chat", response_model=CoachChatOut)
def chat(
    payload: CoachChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    context = performance_context(db, user)
    history = "\n".join(
        f"{message.role}: {message.content}" for message in payload.history[-10:]
    )
    reply = get_user_provider(db, user).coach_reply(
        context=context,
        question=payload.message,
        history=history,
    )
    return CoachChatOut(reply=reply)

