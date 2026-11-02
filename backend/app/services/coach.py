"""Deterministic coaching insights derived from stored interview data.

The narrative is template-based for now. The service boundary is intentionally
small so a future LLM-backed coach can replace or enrich it.
"""
from sqlalchemy.orm import Session

from ..models import Question, User
from ..schemas import (
    CoachDimensionOut,
    CoachInsightsOut,
    RecommendedQuestionOut,
)
from .analytics import (
    completed_interviews,
    current_streak,
    dimension_rows,
    recurring_weaknesses,
    strongest_weakest,
    total_practice_minutes,
)

CATEGORY_BY_DIMENSION = {
    "technical": "System Design",
    "relevance": "HR and Behavioural",
    "structure": "HR and Behavioural",
    "delivery": "HR and Behavioural",
}


def _dimension(row: dict) -> CoachDimensionOut:
    return CoachDimensionOut(
        key=row["key"],
        label=row["label"],
        score=row["score"],
        delta=row.get("delta"),
    )


def _recommended_questions(
    db: Session, weakest_key: str | None, limit: int = 3
) -> list[RecommendedQuestionOut]:
    category = CATEGORY_BY_DIMENSION.get(weakest_key or "")
    query = db.query(Question)
    rows = []
    if category:
        rows = query.filter(Question.category == category).limit(limit).all()
    if not rows:
        rows = query.order_by(Question.category.asc()).limit(limit).all()
    return [
        RecommendedQuestionOut(
            id=row.id,
            body=row.body,
            category=row.category,
            difficulty=row.difficulty,
        )
        for row in rows
    ]


def build_insights(db: Session, user: User) -> CoachInsightsOut:
    interviews = completed_interviews(db, user.id)
    if not interviews:
        return CoachInsightsOut(
            has_data=False,
            summary=(
                "Complete your first mock interview to unlock personalised coaching. "
                "Your strongest and weakest areas, recurring mistakes, and practice "
                "plan will be generated from your actual answers."
            ),
            next_steps=[
                "Run a 3-question behavioural mock interview.",
                "Upload your resume so practice questions can be tailored.",
                "Review the report after your first session.",
            ],
        )

    rows = dimension_rows(interviews)
    strongest, weakest = strongest_weakest(rows)
    mistakes = recurring_weaknesses(interviews)
    improved = sorted(
        [row for row in rows if row.get("delta") is not None and row["delta"] > 1],
        key=lambda row: row["delta"],
        reverse=True,
    )
    recommended = _recommended_questions(
        db, weakest["key"] if weakest else None
    )
    streak = current_streak(db, user.id)
    minutes = total_practice_minutes(interviews)

    next_steps: list[str] = []
    if weakest:
        next_steps.append(
            f"Run a focused mock interview targeting {weakest['label'].lower()}."
        )
    if mistakes:
        next_steps.append(f"Fix the recurring pattern: {mistakes[0]}")
    if recommended:
        next_steps.append(
            f"Practise {len(recommended)} recommended questions from the question bank."
        )
    if streak and streak.current > 0:
        next_steps.append(
            f"Keep your {streak.current}-day streak alive with one short session."
        )

    if weakest and strongest:
        summary = (
            f"Your strongest area is {strongest['label']} at {strongest['score']}/100. "
            f"The biggest opportunity is {weakest['label']} at {weakest['score']}/100. "
            f"You have completed {len(interviews)} scored interviews and practised "
            f"for {minutes} minutes."
        )
    else:
        summary = (
            f"You have completed {len(interviews)} scored interviews and practised "
            f"for {minutes} minutes. Keep going to unlock a clearer skill profile."
        )

    if improved:
        summary += f" Your {improved[0]['label'].lower()} improved by {improved[0]['delta']} points."

    return CoachInsightsOut(
        has_data=True,
        summary=summary,
        strongest=_dimension(strongest) if strongest else None,
        weakest=_dimension(weakest) if weakest else None,
        recurring_mistakes=mistakes,
        improved_skills=[_dimension(row) for row in improved[:3]],
        recommended_questions=recommended,
        next_steps=next_steps,
    )


def performance_context(db: Session, user: User) -> str:
    """Compact context passed to the LLM for follow-up coach questions."""
    interviews = completed_interviews(db, user.id)
    if not interviews:
        return "The user has not completed a scored mock interview yet."

    rows = dimension_rows(interviews)
    strongest, weakest = strongest_weakest(rows)
    mistakes = recurring_weaknesses(interviews)
    avg = round(
        sum(float(i.overall_score or 0) for i in interviews) / len(interviews), 1
    )

    lines = [
        f"Completed interviews: {len(interviews)}",
        f"Average score: {avg}/100",
        f"Total practice minutes: {total_practice_minutes(interviews)}",
    ]
    if strongest:
        lines.append(
            f"Strongest dimension: {strongest['label']} ({strongest['score']}/100)"
        )
    if weakest:
        lines.append(
            f"Weakest dimension: {weakest['label']} ({weakest['score']}/100)"
        )
    if rows:
        lines.append(
            "Dimensions: "
            + ", ".join(f"{row['label']} {row['score']}" for row in rows)
        )
    if mistakes:
        lines.append("Recurring weaknesses: " + " | ".join(mistakes))
    return "\n".join(lines)
