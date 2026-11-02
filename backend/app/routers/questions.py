from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..byok import get_user_provider
from ..database import get_db
from ..deps import get_current_user
from ..models import (
    Question,
    QuestionAttempt,
    QuestionBookmark,
    QuestionProgress,
    User,
)
from ..question_seed import DOMAIN_ORDER, seed_questions
from ..schemas import (
    QuestionAnswerOut,
    QuestionAnswerRequest,
    QuestionDomainOut,
    QuestionOut,
    QuestionStateOut,
)

router = APIRouter(prefix="/api/questions", tags=["questions"])


def _state_maps(db: Session, user_id: str):
    bookmarks = {
        row.question_id
        for row in db.query(QuestionBookmark)
        .filter(QuestionBookmark.user_id == user_id)
        .all()
    }
    completed = {
        row.question_id
        for row in db.query(QuestionProgress)
        .filter(QuestionProgress.user_id == user_id)
        .all()
    }
    attempts = (
        db.query(QuestionAttempt)
        .filter(QuestionAttempt.user_id == user_id)
        .all()
    )
    best_scores: dict[str, float] = {}
    attempt_counts = Counter()
    for attempt in attempts:
        attempt_counts[attempt.question_id] += 1
        current = best_scores.get(attempt.question_id)
        if current is None or attempt.score > current:
            best_scores[attempt.question_id] = attempt.score
    return bookmarks, completed, best_scores, attempt_counts


@router.get("/domains", response_model=list[QuestionDomainOut])
def list_domains(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    seed_questions(db)
    questions = db.query(Question).all()
    totals = Counter(question.category for question in questions)
    question_domain = {question.id: question.category for question in questions}
    bookmarks, completed, best_scores, _ = _state_maps(db, user.id)

    completed_by_domain = Counter()
    for question_id in completed:
        domain = question_domain.get(question_id)
        if domain:
            completed_by_domain[domain] += 1

    scores_by_domain: dict[str, list[float]] = defaultdict(list)
    for question_id, score in best_scores.items():
        domain = question_domain.get(question_id)
        if domain:
            scores_by_domain[domain].append(score)

    order = DOMAIN_ORDER + sorted(set(totals) - set(DOMAIN_ORDER))
    result = []
    for domain in order:
        total = totals.get(domain, 0)
        if total == 0:
            continue
        scores = scores_by_domain.get(domain, [])
        result.append(
            QuestionDomainOut(
                name=domain,
                total=total,
                completed=completed_by_domain.get(domain, 0),
                average_score=round(sum(scores) / len(scores), 1) if scores else None,
            )
        )
    return result


@router.get("", response_model=list[QuestionOut])
def list_questions(
    category: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    bookmarked: bool | None = None,
    completed: bool | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    seed_questions(db)

    query = db.query(Question)
    if category:
        query = query.filter(Question.category == category)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if search and search.strip():
        query = query.filter(Question.body.ilike(f"%{search.strip()}%"))

    questions = (
        query.order_by(Question.category.asc(), Question.position.asc(), Question.body.asc())
        .limit(500)
        .all()
    )
    bookmark_ids, completed_ids, best_scores, attempt_counts = _state_maps(db, user.id)

    if bookmarked is not None:
        questions = [q for q in questions if (q.id in bookmark_ids) == bookmarked]
    if completed is not None:
        questions = [q for q in questions if (q.id in completed_ids) == completed]

    return [
        QuestionOut(
            id=q.id,
            category=q.category,
            difficulty=q.difficulty,
            body=q.body,
            hint=q.hint,
            tags=q.tags or [],
            bookmarked=q.id in bookmark_ids,
            completed=q.id in completed_ids,
            best_score=best_scores.get(q.id),
            attempt_count=attempt_counts.get(q.id, 0),
        )
        for q in questions
    ]


@router.post("/{question_id}/answer", response_model=QuestionAnswerOut)
def answer_question(
    question_id: str,
    payload: QuestionAnswerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    question = _get_question(db, question_id)
    result = get_user_provider(db, user).score_answer(
        question.body, payload.answer, question.category
    )

    attempt = QuestionAttempt(
        user_id=user.id,
        question_id=question.id,
        answer=payload.answer,
        score=float(result["score"]),
        feedback={
            "summary": result.get("summary", ""),
            "dimensions": result.get("dimensions", {}),
            "weaknesses": result.get("weaknesses", []),
        },
    )
    db.add(attempt)

    progress = (
        db.query(QuestionProgress)
        .filter(
            QuestionProgress.user_id == user.id,
            QuestionProgress.question_id == question.id,
        )
        .first()
    )
    if progress is None:
        db.add(QuestionProgress(user_id=user.id, question_id=question.id))

    db.commit()

    best = (
        db.query(QuestionAttempt)
        .filter(
            QuestionAttempt.user_id == user.id,
            QuestionAttempt.question_id == question.id,
        )
        .order_by(QuestionAttempt.score.desc())
        .first()
    )
    return QuestionAnswerOut(
        question_id=question.id,
        score=float(result["score"]),
        summary=result.get("summary", ""),
        dimensions=result.get("dimensions", {}),
        weaknesses=result.get("weaknesses", []),
        best_score=round(best.score, 1) if best else float(result["score"]),
        completed=True,
    )


@router.post("/{question_id}/bookmark", response_model=QuestionStateOut)
def toggle_bookmark(
    question_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_question(db, question_id)
    row = (
        db.query(QuestionBookmark)
        .filter(
            QuestionBookmark.user_id == user.id,
            QuestionBookmark.question_id == question_id,
        )
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
        return QuestionStateOut(bookmarked=False)
    db.add(QuestionBookmark(user_id=user.id, question_id=question_id))
    db.commit()
    return QuestionStateOut(bookmarked=True)


@router.post("/{question_id}/complete", response_model=QuestionStateOut)
def toggle_complete(
    question_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_question(db, question_id)
    row = (
        db.query(QuestionProgress)
        .filter(
            QuestionProgress.user_id == user.id,
            QuestionProgress.question_id == question_id,
        )
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
        return QuestionStateOut(completed=False)
    db.add(QuestionProgress(user_id=user.id, question_id=question_id))
    db.commit()
    return QuestionStateOut(completed=True)


def _get_question(db: Session, question_id: str) -> Question:
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

