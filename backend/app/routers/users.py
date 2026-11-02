import io
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..byok import get_user_provider
from ..database import get_db
from ..deps import get_current_user
from ..models import Resume, Skill, User
from ..schemas import (
    JobAnalysisOut,
    JobAnalysisRequest,
    ResumeOut,
    UserOut,
    UserUpdate,
)
from ..roles import is_excluded_skill
from ..security import is_admin_email


def _user_out(user: User) -> UserOut:
    return UserOut.model_validate(user).model_copy(
        update={"is_admin": is_admin_email(user.email)}
    )


router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/users/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.patch("/users/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.full_name = payload.full_name.strip()
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.post("/resumes/upload", response_model=ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    raw = await file.read()
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    text = _extract_text(raw, file.filename or "resume")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not read text from file")

    provider = get_user_provider(db, user)
    skills = [
        skill
        for skill in provider.extract_skills(text)
        if not is_excluded_skill(skill)
    ]

    resume = Resume(
        user_id=user.id,
        file_name=file.filename or "resume",
        content_text=text[:100_000],
        skills=skills,
        parsed={"word_count": len(text.split())},
    )
    db.add(resume)

    # Upsert skills without overwriting self-assessed ratings.
    for skill_name in skills:
        existing = (
            db.query(Skill)
            .filter(
                Skill.user_id == user.id,
                func.lower(Skill.name) == skill_name.lower(),
            )
            .first()
        )
        if existing:
            continue
        db.add(
            Skill(
                user_id=user.id,
                name=skill_name,
                level=25,
                proficiency=1,
                self_rated=False,
            )
        )
    db.commit()
    db.refresh(resume)
    return resume


@router.post("/jobs/analyze", response_model=JobAnalysisOut)
def analyze_job(
    payload: JobAnalysisRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    provider = get_user_provider(db, user)
    result = provider.analyze_job(payload.title, payload.description)
    return JobAnalysisOut(**result)


def _extract_text(raw: bytes, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(raw))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail="Could not read this PDF. Try a text-based PDF."
            ) from exc
    if suffix == ".docx":
        try:
            from docx import Document

            document = Document(io.BytesIO(raw))
            return "\n".join(paragraph.text for paragraph in document.paragraphs)
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail="Could not read this DOCX file."
            ) from exc
    return _decode(raw)


def _decode(raw: bytes) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")

