from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import PreparationGoal, User
from ..schemas import (
    CoachDimensionOut,
    CoachInsightsOut,
    DashboardOut,
    InterviewOut,
    PerformanceOut,
    PreparationGoalOut,
    SkillsOut,
    SkillDimensionOut,
)
from ..services import analytics
from ..services.coach import build_insights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    interviews = analytics.all_interviews(db, user.id)
    completed = [i for i in interviews if i.overall_score is not None]
    avg = (
        round(sum(float(i.overall_score) for i in completed) / len(completed), 1)
        if completed
        else 0.0
    )
    skill_list = analytics.user_skills(db, user.id)
    streak = analytics.current_streak(db, user.id)
    current_streak = streak.current if streak else 0
    longest_streak = streak.longest if streak else 0

    dimensions = [
        CoachDimensionOut(
            key=row["key"],
            label=row["label"],
            score=row["score"],
            delta=row["delta"],
        )
        for row in analytics.dimension_rows(completed)
    ]

    active = next((i for i in interviews if i.status == "in_progress"), None)

    goals = (
        db.query(PreparationGoal)
        .filter(
            PreparationGoal.user_id == user.id,
            PreparationGoal.status != "completed",
        )
        .all()
    )
    goals.sort(
        key=lambda goal: (
            goal.interview_date is None,
            goal.interview_date or goal.created_at.date(),
        )
    )

    return DashboardOut(
        readiness=analytics.readiness(
            len(completed), avg, current_streak, len(skill_list)
        ),
        streak=current_streak,
        longest_streak=longest_streak,
        interviews_completed=len(completed),
        total_interviews=len(completed),
        avg_score=avg,
        practice_minutes=analytics.total_practice_minutes(completed),
        interviews_change_pct=analytics.period_change(completed, "count"),
        avg_score_change_pct=analytics.period_change(completed, "avg"),
        practice_change_pct=analytics.period_change(completed, "minutes"),
        skills=skill_list,
        dimensions=dimensions,
        recent_interviews=[InterviewOut.model_validate(i) for i in interviews[:5]],
        active_interview=InterviewOut.model_validate(active) if active else None,
        upcoming_goals=[PreparationGoalOut.model_validate(g) for g in goals[:3]],
        coach=build_insights(db, user),
    )


@router.get("/performance", response_model=PerformanceOut)
def get_performance(
    days: int = Query(default=30, ge=0, le=3650),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    completed = analytics.completed_interviews(db, user.id)
    return PerformanceOut(**analytics.performance_payload(completed, days or None))


@router.get("/skills", response_model=SkillsOut)
def get_skills(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    completed = analytics.completed_interviews(db, user.id)
    rows = analytics.dimension_rows(completed)
    strongest, weakest = analytics.strongest_weakest(rows)
    return SkillsOut(
        dimensions=[
            SkillDimensionOut(
                key=row["key"],
                label=row["label"],
                score=row["score"],
                delta=row["delta"],
                explanation=row["explanation"],
            )
            for row in rows
        ],
        resume_skills=[
            {"name": skill["name"], "level": skill["level"]}
            for skill in analytics.user_skills(db, user.id)
        ],
        strongest=strongest["label"] if strongest else None,
        weakest=weakest["label"] if weakest else None,
        recommended_topics=analytics.recommended_topics(
            weakest["key"] if weakest else None
        ),
    )


@router.get("/recommendations", response_model=CoachInsightsOut)
def get_recommendations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return build_insights(db, user)
