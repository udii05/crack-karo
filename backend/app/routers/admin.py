from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_admin
from ..models import User
from ..schemas import AdminUserOut
from ..security import is_admin_email

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        AdminUserOut(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            is_admin=is_admin_email(user.email),
            created_at=user.created_at,
        )
        for user in users
    ]
