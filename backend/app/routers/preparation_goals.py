from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import PreparationGoal, User
from ..schemas import (
    PreparationGoalCreate,
    PreparationGoalOut,
    PreparationGoalUpdate,
)

router = APIRouter(prefix="/api/preparation-goals", tags=["preparation"])


def _own_goal(db: Session, goal_id: str, user_id: str) -> PreparationGoal:
    goal = db.get(PreparationGoal, goal_id)
    if not goal or goal.user_id != user_id:
        raise HTTPException(status_code=404, detail="Preparation goal not found")
    return goal


def _sorted_goals(goals: list[PreparationGoal]) -> list[PreparationGoal]:
    return sorted(
        goals,
        key=lambda goal: (
            goal.interview_date is None,
            goal.interview_date or goal.created_at.date(),
            goal.company.lower(),
        ),
    )


@router.get("", response_model=list[PreparationGoalOut])
def list_goals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goals = (
        db.query(PreparationGoal)
        .filter(PreparationGoal.user_id == user.id)
        .all()
    )
    return _sorted_goals(goals)


@router.post("", response_model=PreparationGoalOut, status_code=201)
def create_goal(
    payload: PreparationGoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = PreparationGoal(user_id=user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/{goal_id}", response_model=PreparationGoalOut)
def update_goal(
    goal_id: str,
    payload: PreparationGoalUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = _own_goal(db, goal_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = _own_goal(db, goal_id, user.id)
    db.delete(goal)
    db.commit()
    return None
