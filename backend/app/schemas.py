from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_admin: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    is_admin: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)


# ---------- Resume ----------
class ResumeOut(BaseModel):
    id: str
    file_name: str
    skills: list[str]
    parsed: dict
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Job analysis ----------
class JobAnalysisRequest(BaseModel):
    title: str
    company: str = ""
    description: str


class JobAnalysisOut(BaseModel):
    skills: list[str]
    likely_questions: list[str]


# ---------- Questions ----------
class QuestionOut(BaseModel):
    id: str
    category: str
    difficulty: str
    body: str
    hint: str
    tags: list[str]
    bookmarked: bool = False
    completed: bool = False
    best_score: Optional[float] = None
    attempt_count: int = 0

    model_config = {"from_attributes": True}


class QuestionDomainOut(BaseModel):
    name: str
    total: int
    completed: int
    average_score: Optional[float] = None


class QuestionAnswerRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=20000)


class QuestionAnswerOut(BaseModel):
    question_id: str
    score: float
    summary: str
    dimensions: dict[str, float] = {}
    weaknesses: list[str] = []
    best_score: float
    completed: bool = True


class QuestionStateOut(BaseModel):
    bookmarked: bool = False
    completed: bool = False


# ---------- Skills and role fit ----------
class ProviderStatusOut(BaseModel):
    provider: str
    label: str
    models: list[str]
    capabilities: list[str]
    default_model: str
    configured: bool
    key_hint: str
    model: str


class ProviderKeyIn(BaseModel):
    api_key: str = Field(default="", max_length=500)
    model: str = Field(default="", max_length=80)


class ProviderTestOut(BaseModel):
    ok: bool
    message: str


class SkillOut(BaseModel):
    id: str
    name: str
    level: int
    proficiency: int
    self_rated: bool
    last_assessed_at: datetime

    model_config = {"from_attributes": True}


class SkillCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    proficiency: int = Field(default=1, ge=1, le=4)


class SkillRatingItem(BaseModel):
    skill_id: str
    proficiency: int = Field(ge=1, le=4)


class SkillRatingsRequest(BaseModel):
    ratings: list[SkillRatingItem] = Field(min_length=1, max_length=100)


class RoleOut(BaseModel):
    name: str
    description: str
    required_count: int


class RoleRequirementOut(BaseModel):
    requirement: str
    weight: int
    matched_skill: Optional[str] = None
    rating: Optional[int] = None
    rated: bool = False


class RoleAssessmentOut(BaseModel):
    role: str
    description: str
    score: float
    coverage: float
    matched_count: int
    required_count: int
    readiness: str
    skills: list[RoleRequirementOut]
    missing_skills: list[str]
    recommendations: list[str]


class SkillFocusAreaOut(BaseModel):
    skill: str
    why: str
    topics: list[str] = []
    action: str = ""


class SkillRecommendationsOut(BaseModel):
    role: str
    summary: str
    focus_areas: list[SkillFocusAreaOut] = []
    study_plan: list[str] = []
    source: str = "llm"


# ---------- Interviews ----------
class InterviewCreate(BaseModel):
    type: str = "behavioral"
    difficulty: str = "intermediate"
    title: str = "Mock Interview"
    question_count: int = Field(default=3, ge=1, le=10)
    duration_minutes: int = Field(default=30, ge=5, le=120)


class SessionOut(BaseModel):
    id: str
    sequence: int
    question: str
    user_answer: str
    score: Optional[float]
    feedback: dict

    model_config = {"from_attributes": True}


class InterviewOut(BaseModel):
    id: str
    title: str
    type: str
    difficulty: str
    status: str
    overall_score: Optional[float]
    duration_minutes: int = 30
    actual_duration_minutes: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class InterviewDetailOut(InterviewOut):
    sessions: list[SessionOut] = []
    report: dict = {}


class AnswerRequest(BaseModel):
    answer: str = Field(min_length=1)


# ---------- Copilot ----------
class CopilotRequest(BaseModel):
    context: str = ""
    transcript: str = ""


class CopilotOut(BaseModel):
    suggestion: str
    talking_points: list[str]
    star_outline: Optional[dict] = None


# ---------- Preparation goals ----------
GoalStatus = Literal["planning", "preparing", "ready", "completed"]


class PreparationGoalCreate(BaseModel):
    company: str = Field(min_length=1, max_length=120)
    role: str = Field(min_length=1, max_length=120)
    interview_date: Optional[date] = None
    round: str = Field(default="Technical", max_length=60)
    status: GoalStatus = "preparing"
    progress: int = Field(default=0, ge=0, le=100)


class PreparationGoalUpdate(BaseModel):
    company: Optional[str] = Field(default=None, min_length=1, max_length=120)
    role: Optional[str] = Field(default=None, min_length=1, max_length=120)
    interview_date: Optional[date] = None
    round: Optional[str] = Field(default=None, max_length=60)
    status: Optional[GoalStatus] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)


class PreparationGoalOut(BaseModel):
    id: str
    company: str
    role: str
    interview_date: Optional[date]
    round: str
    status: str
    progress: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Dashboard and analytics ----------
class CoachDimensionOut(BaseModel):
    key: str
    label: str
    score: float
    delta: Optional[float] = None


class RecommendedQuestionOut(BaseModel):
    id: str
    body: str
    category: str
    difficulty: str


class CoachInsightsOut(BaseModel):
    has_data: bool
    summary: str
    strongest: Optional[CoachDimensionOut] = None
    weakest: Optional[CoachDimensionOut] = None
    recurring_mistakes: list[str] = []
    improved_skills: list[CoachDimensionOut] = []
    recommended_questions: list[RecommendedQuestionOut] = []
    next_steps: list[str] = []


class DashboardOut(BaseModel):
    readiness: int
    streak: int
    longest_streak: int = 0
    interviews_completed: int
    total_interviews: int = 0
    avg_score: float
    practice_minutes: int = 0
    interviews_change_pct: Optional[float] = None
    avg_score_change_pct: Optional[float] = None
    practice_change_pct: Optional[float] = None
    skills: list[dict]
    dimensions: list[CoachDimensionOut] = []
    recent_interviews: list[InterviewOut]
    active_interview: Optional[InterviewOut] = None
    upcoming_goals: list[PreparationGoalOut] = []
    coach: Optional[CoachInsightsOut] = None


class PerformancePointOut(BaseModel):
    date: str
    score: float
    interview_id: str
    title: str


class PerformanceTypeOut(BaseModel):
    type: str
    count: int
    avg_score: float


class PerformanceOut(BaseModel):
    points: list[PerformancePointOut]
    average: float
    total: int
    practice_minutes: int
    by_type: list[PerformanceTypeOut]
    strongest_dimension: Optional[str] = None
    weakest_dimension: Optional[str] = None


class SkillDimensionOut(BaseModel):
    key: str
    label: str
    score: float
    delta: Optional[float] = None
    explanation: str


class ResumeSkillOut(BaseModel):
    name: str
    level: int


class SkillsOut(BaseModel):
    dimensions: list[SkillDimensionOut]
    resume_skills: list[ResumeSkillOut]
    strongest: Optional[str] = None
    weakest: Optional[str] = None
    recommended_topics: list[str] = []


class CoachChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class CoachChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[CoachChatMessage] = Field(default_factory=list, max_length=20)


class CoachChatOut(BaseModel):
    reply: str


