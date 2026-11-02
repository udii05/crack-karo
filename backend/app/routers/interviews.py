from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..byok import get_user_provider
from ..database import get_db
from ..deps import get_current_user
from ..models import Interview, InterviewSession, Skill, Streak, User
from ..schemas import (
    AnswerRequest,
    InterviewCreate,
    InterviewDetailOut,
    InterviewOut,
    QuestionOut,
)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

DEFAULT_QUESTIONS = {
    "behavioral": [
        "Tell me about a time you worked under pressure.",
        "Describe a disagreement you resolved with a teammate.",
        "Tell me about a project you are proud of.",
    ],
    "technical": [
        "Explain the difference between SQL and NoSQL databases.",
        "How does an HTTP request work end to end?",
        "Describe the difference between a process and a thread.",
    ],
}


@router.post("", response_model=InterviewDetailOut, status_code=201)
def create_interview(
    payload: InterviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    provider = get_user_provider(db, user)
    skills = _user_skills(db, user.id)
    questions = []
    for i in range(payload.question_count):
        q = provider.generate_question(payload.type, payload.difficulty, skills)
        questions.append(
            {"body": q["body"], "hint": q.get("hint", ""), "sequence": i + 1}
        )

    interview = Interview(
        user_id=user.id,
        title=payload.title,
        type=payload.type,
        difficulty=payload.difficulty,
        status="in_progress",
        duration_minutes=payload.duration_minutes,
    )
    db.add(interview)
    db.flush()

    for q in questions:
        db.add(
            InterviewSession(
                interview_id=interview.id,
                sequence=q["sequence"],
                question=q["body"],
                feedback={"hint": q["hint"]},
            )
        )
    db.commit()
    db.refresh(interview)
    return _detail(db, interview.id)


@router.get("", response_model=list[InterviewOut])
def list_interviews(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = (
        db.query(Interview)
        .filter(Interview.user_id == user.id)
        .order_by(Interview.created_at.desc())
        .limit(50)
        .all()
    )
    return items


@router.get("/{interview_id}", response_model=InterviewDetailOut)
def get_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _detail(db, interview_id, user_id=user.id)


@router.post("/{interview_id}/answer", response_model=InterviewDetailOut)
def submit_answer(
    interview_id: str,
    payload: AnswerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    interview = _own_interview(db, interview_id, user.id)
    if interview.status != "in_progress":
        raise HTTPException(status_code=400, detail="Interview is not in progress")

    next_session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.interview_id == interview_id,
            InterviewSession.user_answer == "",
        )
        .order_by(InterviewSession.sequence.asc())
        .first()
    )
    if not next_session:
        raise HTTPException(status_code=400, detail="No more questions in this interview")

    provider = get_user_provider(db, user)
    result = provider.score_answer(next_session.question, payload.answer, interview.type)

    next_session.user_answer = payload.answer
    next_session.score = result["score"]
    next_session.feedback = {
        "summary": result.get("summary", ""),
        "dimensions": result.get("dimensions", {}),
        "weaknesses": result.get("weaknesses", []),
        "hint": next_session.feedback.get("hint", ""),
    }
    db.commit()

    remaining = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.interview_id == interview_id,
            InterviewSession.user_answer == "",
        )
        .count()
    )
    if remaining == 0:
        _complete_interview(db, interview)

    return _detail(db, interview_id)


@router.post("/{interview_id}/complete", response_model=InterviewDetailOut)
def complete_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    interview = _own_interview(db, interview_id, user.id)
    if interview.status == "in_progress":
        _complete_interview(db, interview)
    return _detail(db, interview_id)


# ---------- helpers ----------
def _user_skills(db: Session, user_id: str) -> list[str]:
    rows = db.query(Skill).filter(Skill.user_id == user_id).all()
    return [s.name for s in rows]


def _own_interview(db: Session, interview_id: str, user_id: str) -> Interview:
    interview = db.get(Interview, interview_id)
    if not interview or interview.user_id != user_id:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


def _detail(db: Session, interview_id: str, user_id: str | None = None) -> InterviewDetailOut:
    interview = db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if user_id is not None and interview.user_id != user_id:
        raise HTTPException(status_code=404, detail="Interview not found")
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.interview_id == interview_id)
        .order_by(InterviewSession.sequence.asc())
        .all()
    )
    out = InterviewDetailOut.model_validate(interview)
    out.sessions = sessions
    return out


def _complete_interview(db: Session, interview: Interview) -> None:
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.interview_id == interview.id)
        .all()
    )
    answered = [s for s in sessions if s.score is not None]
    avg = round(sum(s.score for s in answered) / len(answered), 1) if answered else 0.0

    interview.overall_score = avg
    interview.status = "completed"
    interview.completed_at = datetime.now(timezone.utc)
    interview.report = {
        "summary": _report_summary(avg),
        "session_count": len(answered),
        "strongest_dimension": _strongest(sessions),
    }

    # bump streak
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    streak = db.query(Streak).filter(Streak.user_id == interview.user_id).first()
    if not streak:
        streak = Streak(user_id=interview.user_id, current=1, longest=1, last_activity=today)
        db.add(streak)
    else:
        from datetime import date, timedelta

        yesterday = (date.today() - timedelta(days=1)).isoformat()
        if streak.last_activity == yesterday:
            streak.current += 1
            streak.longest = max(streak.longest, streak.current)
        elif streak.last_activity != today:
            streak.current = 1
        streak.last_activity = today
    db.commit()


def _report_summary(avg: float) -> str:
    if avg >= 80:
        return "Excellent performance. You are well prepared for real interviews."
    if avg >= 60:
        return "Good performance. Keep practicing to sharpen your structure and examples."
    return "Keep practicing. Focus on giving structured, specific answers."


def _strongest(sessions: list[InterviewSession]) -> str:
    dims: dict[str, list[float]] = {}
    for s in sessions:
        d = s.feedback.get("dimensions", {}) if s.feedback else {}
        for k, v in d.items():
            if isinstance(v, (int, float)):
                dims.setdefault(k, []).append(float(v))
    best = max(dims, key=lambda k: sum(dims[k]) / len(dims[k])) if dims else "relevance"
    return best
