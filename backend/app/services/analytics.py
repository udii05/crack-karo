"""Data-derived analytics for the dashboard.

Everything in this module is computed from the user's stored interview
sessions. No metrics are invented when the underlying data is missing.
"""
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from statistics import mean

from sqlalchemy.orm import Session

from ..models import Interview, Skill, Streak
from ..roles import is_excluded_skill

DIMENSION_META = {
    "relevance": {
        "label": "Answer Relevance",
        "explanation": "How directly your answer addresses the question that was asked.",
    },
    "structure": {
        "label": "Structure and Communication",
        "explanation": "How clearly your answer is organised, including STAR for behavioural questions.",
    },
    "technical": {
        "label": "Technical Accuracy",
        "explanation": "Correctness, specificity, and depth of the technical content in your answer.",
    },
    "delivery": {
        "label": "Delivery and Confidence",
        "explanation": "Clarity, completeness, pacing, and professional tone of your response.",
    },
}
DIMENSION_ORDER = ["relevance", "structure", "technical", "delivery"]


def _naive(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=None) if value.tzinfo else value


def completed_interviews(db: Session, user_id: str) -> list[Interview]:
    return (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.overall_score.isnot(None),
        )
        .order_by(Interview.created_at.asc())
        .all()
    )


def all_interviews(db: Session, user_id: str, limit: int | None = None) -> list[Interview]:
    query = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(Interview.created_at.desc())
    )
    if limit:
        query = query.limit(limit)
    return query.all()


def interview_minutes(interview: Interview) -> int:
    return interview.actual_duration_minutes or 0


def total_practice_minutes(interviews: list[Interview]) -> int:
    return sum(interview_minutes(i) for i in interviews)


def aggregate_dimensions(interviews: list[Interview]) -> dict[str, float]:
    values: dict[str, list[float]] = defaultdict(list)
    for interview in interviews:
        for session in interview.sessions:
            feedback = session.feedback or {}
            dimensions = feedback.get("dimensions") or {}
            for key in DIMENSION_ORDER:
                value = dimensions.get(key)
                if isinstance(value, (int, float)):
                    values[key].append(float(value))
    return {
        key: round(mean(items), 1)
        for key, items in values.items()
        if items
    }


def dimension_rows(interviews: list[Interview]) -> list[dict]:
    averages = aggregate_dimensions(interviews)
    if not averages:
        return []

    delta: dict[str, float | None] = {key: None for key in averages}
    if len(interviews) >= 2:
        midpoint = len(interviews) // 2
        older = aggregate_dimensions(interviews[:midpoint])
        newer = aggregate_dimensions(interviews[midpoint:])
        for key in averages:
            if key in older and key in newer:
                delta[key] = round(newer[key] - older[key], 1)

    rows = []
    for key in DIMENSION_ORDER:
        if key not in averages:
            continue
        meta = DIMENSION_META[key]
        rows.append(
            {
                "key": key,
                "label": meta["label"],
                "score": averages[key],
                "delta": delta[key],
                "explanation": meta["explanation"],
            }
        )
    return rows


def strongest_weakest(rows: list[dict]) -> tuple[dict | None, dict | None]:
    if not rows:
        return None, None
    strongest = max(rows, key=lambda row: row["score"])
    weakest = min(rows, key=lambda row: row["score"])
    return strongest, weakest


def recurring_weaknesses(interviews: list[Interview], limit: int = 3) -> list[str]:
    counter: Counter[str] = Counter()
    for interview in interviews:
        for session in interview.sessions:
            weaknesses = (session.feedback or {}).get("weaknesses") or []
            if not isinstance(weaknesses, list):
                continue
            for item in weaknesses:
                text = str(item).strip()
                if text:
                    counter[text] += 1
    return [text for text, _ in counter.most_common(limit)]


def period_change(interviews: list[Interview], metric: str) -> float | None:
    """Compare the last 30 days with the previous 30 days."""
    now = datetime.now().replace(tzinfo=None)
    recent_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)

    recent = []
    previous = []
    for interview in interviews:
        stamp = _naive(interview.completed_at or interview.created_at)
        if not stamp:
            continue
        if stamp >= recent_start:
            recent.append(interview)
        elif stamp >= previous_start:
            previous.append(interview)

    def value(items: list[Interview]) -> float:
        if metric == "count":
            return float(len(items))
        if metric == "minutes":
            return float(total_practice_minutes(items))
        scores = [float(i.overall_score) for i in items if i.overall_score is not None]
        return mean(scores) if scores else 0.0

    recent_value = value(recent)
    previous_value = value(previous)
    if previous_value == 0:
        return None
    return round(((recent_value - previous_value) / previous_value) * 100, 1)


def performance_payload(interviews: list[Interview], days: int | None) -> dict:
    cutoff = None
    if days and days > 0:
        cutoff = datetime.now().replace(tzinfo=None) - timedelta(days=days)

    filtered = []
    for interview in interviews:
        stamp = _naive(interview.completed_at or interview.created_at)
        if cutoff is None or (stamp is not None and stamp >= cutoff):
            filtered.append(interview)

    points = [
        {
            "date": (_naive(i.completed_at or i.created_at) or datetime.now()).isoformat(),
            "score": float(i.overall_score or 0),
            "interview_id": i.id,
            "title": i.title,
        }
        for i in filtered
    ]

    by_type_map: dict[str, list[float]] = defaultdict(list)
    for interview in filtered:
        if interview.overall_score is not None:
            by_type_map[interview.type].append(float(interview.overall_score))
    by_type = [
        {
            "type": key,
            "count": len(values),
            "avg_score": round(mean(values), 1),
        }
        for key, values in sorted(by_type_map.items())
    ]

    rows = dimension_rows(filtered)
    strongest, weakest = strongest_weakest(rows)

    return {
        "points": points,
        "average": round(mean([p["score"] for p in points]), 1) if points else 0.0,
        "total": len(points),
        "practice_minutes": total_practice_minutes(filtered),
        "by_type": by_type,
        "strongest_dimension": strongest["key"] if strongest else None,
        "weakest_dimension": weakest["key"] if weakest else None,
    }


def skill_rows(interviews: list[Interview]) -> list[dict]:
    return dimension_rows(interviews)


def readiness(completed: int, avg: float, streak: int, skill_count: int) -> int:
    score = 0.0
    score += min(40, completed * 8)
    score += (avg / 100) * 40
    score += min(10, streak * 2)
    score += min(10, skill_count)
    return min(100, int(score))


def user_skills(db: Session, user_id: str) -> list[dict]:
    rows = db.query(Skill).filter(Skill.user_id == user_id).all()
    return [
        {"name": row.name, "level": row.level}
        for row in rows
        if not is_excluded_skill(row.name)
    ]


def current_streak(db: Session, user_id: str) -> Streak | None:
    return db.query(Streak).filter(Streak.user_id == user_id).first()


def recommended_topics(weakest_key: str | None) -> list[str]:
    topics = {
        "relevance": [
            "Answer the exact question first, then add supporting detail.",
            "Practise one-sentence answer-first responses.",
            "Summarise the question before you begin speaking.",
        ],
        "structure": [
            "Build three reusable STAR stories with measurable results.",
            "Use signposting: situation, task, action, result.",
            "Keep each answer under two minutes.",
        ],
        "technical": [
            "Explain architectural trade-offs out loud.",
            "Practise system design fundamentals and scaling patterns.",
            "Add one concrete implementation detail to every technical answer.",
        ],
        "delivery": [
            "Record yourself and remove filler words.",
            "Practise a steady pace with deliberate pauses.",
            "End every answer with a concise outcome.",
        ],
    }
    return topics.get(weakest_key or "", [
        "Complete a mock interview to unlock personalised recommendations.",
        "Upload your resume to build your skill profile.",
        "Review your latest report and pick one improvement area.",
    ])
