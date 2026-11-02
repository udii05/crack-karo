import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def uuid_str() -> str:
    return str(uuid.uuid4())



class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="job_seeker")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    resumes: Mapped[list["Resume"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    interviews: Mapped[list["Interview"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    content_text: Mapped[str] = mapped_column(Text, default="")
    skills: Mapped[list] = mapped_column(JSON, default=list)
    parsed: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="resumes")


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255), default="Mock Interview")
    type: Mapped[str] = mapped_column(String(32), default="behavioral")
    difficulty: Mapped[str] = mapped_column(String(32), default="intermediate")
    status: Mapped[str] = mapped_column(String(32), default="in_progress")
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    report: Mapped[dict] = mapped_column(JSON, default=dict)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @property
    def actual_duration_minutes(self) -> int | None:
        if not self.created_at or not self.completed_at:
            return None
        start = self.created_at
        end = self.completed_at
        if start.tzinfo is not None and end.tzinfo is None:
            start = start.replace(tzinfo=None)
        elif start.tzinfo is None and end.tzinfo is not None:
            end = end.replace(tzinfo=None)
        return max(0, round((end - start).total_seconds() / 60))

    user: Mapped["User"] = relationship(back_populates="interviews")
    sessions: Mapped[list["InterviewSession"]] = relationship(
        back_populates="interview", cascade="all, delete-orphan"
    )


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    interview_id: Mapped[str] = mapped_column(ForeignKey("interviews.id"), index=True)
    sequence: Mapped[int] = mapped_column(Integer, default=0)
    question: Mapped[str] = mapped_column(Text)
    user_answer: Mapped[str] = mapped_column(Text, default="")
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    feedback: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    interview: Mapped["Interview"] = relationship(back_populates="sessions")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    category: Mapped[str] = mapped_column(String(30), default="behavioral")
    difficulty: Mapped[str] = mapped_column(String(30), default="intermediate")
    body: Mapped[str] = mapped_column(Text)
    hint: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list] = mapped_column(JSON, default=list)
    position: Mapped[int] = mapped_column(Integer, default=0)


class CopilotSession(Base):
    __tablename__ = "copilot_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    level: Mapped[int] = mapped_column(Integer, default=0)
    proficiency: Mapped[int] = mapped_column(Integer, default=1)  # 1..4
    self_rated: Mapped[bool] = mapped_column(Boolean, default=False)
    last_assessed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ProviderKey(Base):
    __tablename__ = "provider_keys"
    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uq_provider_key"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[str] = mapped_column(String(30), index=True)
    encrypted_key: Mapped[str] = mapped_column(Text)
    key_hint: Mapped[str] = mapped_column(String(20), default="")
    model: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class Streak(Base):
    __tablename__ = "streaks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    current: Mapped[int] = mapped_column(Integer, default=0)
    longest: Mapped[int] = mapped_column(Integer, default=0)
    last_activity: Mapped[str] = mapped_column(String(10), default="")  # YYYY-MM-DD


class PreparationGoal(Base):
    __tablename__ = "preparation_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    company: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(120))
    interview_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    round: Mapped[str] = mapped_column(String(60), default="Technical")
    status: Mapped[str] = mapped_column(String(30), default="preparing")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class QuestionBookmark(Base):
    __tablename__ = "question_bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_question_bookmark"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class QuestionProgress(Base):
    __tablename__ = "question_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_question_progress"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id"), index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class QuestionAttempt(Base):
    __tablename__ = "question_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id"), index=True)
    answer: Mapped[str] = mapped_column(Text)
    score: Mapped[float] = mapped_column(Float)
    feedback: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
