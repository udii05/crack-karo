from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..byok import get_user_provider
from ..database import get_db
from ..deps import get_current_user
from ..models import Skill, User
from ..roles import (
    EXCLUDED_SKILLS,
    ROLES,
    assess_role,
    get_role,
    is_excluded_skill,
    topics_for_requirement,
)
from ..schemas import (
    RoleAssessmentOut,
    RoleOut,
    RoleRequirementOut,
    SkillCreate,
    SkillFocusAreaOut,
    SkillOut,
    SkillRatingsRequest,
    SkillRecommendationsOut,
)

router = APIRouter(prefix="/api/skills", tags=["skills"])

PROFICIENCY_TO_LEVEL = {1: 25, 2: 50, 3: 75, 4: 100}


@router.get("", response_model=list[SkillOut])
def list_skills(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Skill)
        .filter(
            Skill.user_id == user.id,
            func.lower(Skill.name).notin_(list(EXCLUDED_SKILLS)),
        )
        .order_by(Skill.name.asc())
        .all()
    )


@router.post("", response_model=SkillOut, status_code=201)
def add_skill(
    payload: SkillCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    name = payload.name.strip()
    if is_excluded_skill(name):
        raise HTTPException(
            status_code=400,
            detail="Communication is developed through interviews, not self-rating.",
        )
    existing = (
        db.query(Skill)
        .filter(
            Skill.user_id == user.id,
            func.lower(Skill.name) == name.lower(),
        )
        .first()
    )
    level = PROFICIENCY_TO_LEVEL[payload.proficiency]
    if existing:
        existing.level = level
        existing.proficiency = payload.proficiency
        existing.self_rated = True
        existing.last_assessed_at = datetime.now(timezone.utc)
    else:
        existing = Skill(
            user_id=user.id,
            name=name,
            level=level,
            proficiency=payload.proficiency,
            self_rated=True,
            last_assessed_at=datetime.now(timezone.utc),
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


@router.put("/ratings", response_model=list[SkillOut])
def save_ratings(
    payload: SkillRatingsRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    skills = {
        skill.id: skill
        for skill in db.query(Skill).filter(Skill.user_id == user.id).all()
    }
    for rating in payload.ratings:
        skill = skills.get(rating.skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        if is_excluded_skill(skill.name):
            continue
        skill.proficiency = rating.proficiency
        skill.level = PROFICIENCY_TO_LEVEL[rating.proficiency]
        skill.self_rated = True
        skill.last_assessed_at = datetime.now(timezone.utc)
    db.commit()
    return (
        db.query(Skill)
        .filter(
            Skill.user_id == user.id,
            func.lower(Skill.name).notin_(list(EXCLUDED_SKILLS)),
        )
        .order_by(Skill.name.asc())
        .all()
    )


@router.get("/roles", response_model=list[RoleOut])
def list_roles(user: User = Depends(get_current_user)):
    return [
        RoleOut(
            name=role.name,
            description=role.description,
            required_count=len(role.requirements),
        )
        for role in ROLES
    ]


def _topic_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()][:5]


def _fallback_recommendations(role_name: str, assessment: dict) -> dict:
    focus_areas = []
    for row in assessment["skills"]:
        rating = row.get("rating")
        if rating is not None and rating >= 70:
            continue
        if row.get("matched_skill"):
            why = (
                f"Your self-rating is {rating}/100, below the target for this role."
            )
        else:
            why = (
                f"This requirement carries {row['weight']}% of the role and is "
                "missing from your profile."
            )
        focus_areas.append(
            {
                "skill": row["requirement"],
                "why": why,
                "topics": topics_for_requirement(row["requirement"]),
                "action": "Work through these topics, then answer 3 practice questions.",
            }
        )
        if len(focus_areas) >= 6:
            break
    if not focus_areas:
        focus_areas = [
            {
                "skill": "Advanced role scenarios",
                "why": "Your profile covers the core requirements; now practise depth.",
                "topics": [
                    "System design trade-offs",
                    "Production debugging",
                    "Architecture review",
                ],
                "action": "Run a full mock interview and review the feedback.",
            }
        ]
    return {
        "summary": (
            f"Your {role_name} profile has a clear starting point. Work through "
            "the topics below to close the highest-weight gaps."
        ),
        "focus_areas": focus_areas,
        "study_plan": [
            "Review the topics for the highest-weight gap first.",
            "Practise 5 focused questions in each weak area.",
            "Run a mock interview and compare the new feedback.",
        ],
    }


def _normalize_recommendations(raw: dict, assessment: dict, role_name: str) -> dict:
    summary = str(raw.get("summary") or "").strip()
    if not summary:
        summary = (
            "These are the skills that need more attention. Focus on strengthening "
            "these areas to improve your interview readiness."
        )
    focus_areas = []
    raw_areas = raw.get("focus_areas")
    if isinstance(raw_areas, list):
        for item in raw_areas[:6]:
            if not isinstance(item, dict):
                continue
            skill = str(item.get("skill") or "").strip()
            if not skill:
                continue
            topics = _topic_list(item.get("topics"))
            if not topics:
                topics = topics_for_requirement(skill)
            focus_areas.append(
                {
                    "skill": skill,
                    "why": str(item.get("why") or "Focus area for this role.").strip(),
                    "topics": topics,
                    "action": str(
                        item.get("action")
                        or "Study these topics, then answer 3 practice questions."
                    ).strip(),
                }
            )
    if not focus_areas:
        fallback = _fallback_recommendations(role_name, assessment)
        return {**fallback, "source": "fallback"}
    study_plan = _topic_list(raw.get("study_plan"))
    if not study_plan:
        study_plan = [
            "Review the topics for the highest-weight gap first.",
            "Practise 5 focused questions in each weak area.",
            "Run a mock interview and compare the new feedback.",
        ]
    return {
        "summary": summary,
        "focus_areas": focus_areas,
        "study_plan": study_plan,
        "source": "llm",
    }


@router.get("/recommendations", response_model=SkillRecommendationsOut)
def recommendations(
    role: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    profile = get_role(role)
    if not profile:
        raise HTTPException(status_code=404, detail="Role profile not found")
    skills = [
        skill
        for skill in db.query(Skill).filter(Skill.user_id == user.id).all()
        if not is_excluded_skill(skill.name)
    ]
    assessment = assess_role(profile, skills)

    low_areas = [
        f"{row['requirement']} ({row['rating']}/100)"
        for row in assessment["skills"]
        if row.get("rating") is not None and row["rating"] < 70
    ]
    context = "\n".join(
        [
            f"Role: {profile.name}",
            f"Fit score: {assessment['score']}/100",
            f"Readiness: {assessment['readiness']}",
            f"Coverage: {assessment['coverage']}%",
            "Missing requirements: "
            + (", ".join(assessment["missing_skills"]) or "none"),
            "Low-rated matched areas: " + (", ".join(low_areas) or "none"),
            "All self-rated skills: "
            + (
                ", ".join(f"{skill.name} {skill.level}/100" for skill in skills)
                or "none yet"
            ),
        ]
    )

    try:
        raw = get_user_provider(db, user).skill_recommendations(profile.name, context)
        normalized = _normalize_recommendations(raw, assessment, profile.name)
    except Exception:
        normalized = {
            **_fallback_recommendations(profile.name, assessment),
            "source": "fallback",
        }

    return SkillRecommendationsOut(
        role=profile.name,
        summary=normalized["summary"],
        focus_areas=[SkillFocusAreaOut(**row) for row in normalized["focus_areas"]],
        study_plan=normalized["study_plan"],
        source=normalized["source"],
    )


@router.get("/assessment", response_model=RoleAssessmentOut)
def assess(
    role: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    profile = get_role(role)
    if not profile:
        raise HTTPException(status_code=404, detail="Role profile not found")
    skills = [
        skill
        for skill in db.query(Skill).filter(Skill.user_id == user.id).all()
        if not is_excluded_skill(skill.name)
    ]
    result = assess_role(profile, skills)
    result["skills"] = [RoleRequirementOut(**row) for row in result["skills"]]
    return RoleAssessmentOut(**result)

