const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_admin: boolean;
  created_at: string;
};

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_admin: boolean;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type ProviderStatus = {
  provider: string;
  label: string;
  models: string[];
  capabilities: string[];
  default_model: string;
  configured: boolean;
  key_hint: string;
  model: string;
};

export type ProviderTestResult = {
  ok: boolean;
  message: string;
};

export type Question = {
  id: string;
  category: string;
  difficulty: string;
  body: string;
  hint: string;
  tags: string[];
  bookmarked: boolean;
  completed: boolean;
  best_score: number | null;
  attempt_count: number;
};

export type QuestionDomain = {
  name: string;
  total: number;
  completed: number;
  average_score: number | null;
};

export type QuestionAnswerResult = {
  question_id: string;
  score: number;
  summary: string;
  dimensions: Record<string, number>;
  weaknesses: string[];
  best_score: number;
  completed: boolean;
};

export type Session = {
  id: string;
  sequence: number;
  question: string;
  user_answer: string;
  score: number | null;
  feedback: {
    summary?: string;
    dimensions?: Record<string, number>;
    weaknesses?: string[];
    hint?: string;
  };
};

export type Interview = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  status: string;
  overall_score: number | null;
  duration_minutes: number;
  actual_duration_minutes: number | null;
  created_at: string;
  completed_at: string | null;
};

export type InterviewDetail = Interview & {
  sessions: Session[];
  report: Record<string, unknown>;
};

export type CoachDimension = {
  key: string;
  label: string;
  score: number;
  delta: number | null;
};

export type RecommendedQuestion = {
  id: string;
  body: string;
  category: string;
  difficulty: string;
};

export type CoachInsights = {
  has_data: boolean;
  summary: string;
  strongest: CoachDimension | null;
  weakest: CoachDimension | null;
  recurring_mistakes: string[];
  improved_skills: CoachDimension[];
  recommended_questions: RecommendedQuestion[];
  next_steps: string[];
};

export type PreparationGoal = {
  id: string;
  company: string;
  role: string;
  interview_date: string | null;
  round: string;
  status: string;
  progress: number;
  created_at: string;
};

export type Dashboard = {
  readiness: number;
  streak: number;
  longest_streak: number;
  interviews_completed: number;
  total_interviews: number;
  avg_score: number;
  practice_minutes: number;
  interviews_change_pct: number | null;
  avg_score_change_pct: number | null;
  practice_change_pct: number | null;
  skills: { name: string; level: number }[];
  dimensions: CoachDimension[];
  recent_interviews: Interview[];
  active_interview: Interview | null;
  upcoming_goals: PreparationGoal[];
  coach: CoachInsights | null;
};

export type PerformancePoint = {
  date: string;
  score: number;
  interview_id: string;
  title: string;
};

export type PerformanceType = {
  type: string;
  count: number;
  avg_score: number;
};

export type Performance = {
  points: PerformancePoint[];
  average: number;
  total: number;
  practice_minutes: number;
  by_type: PerformanceType[];
  strongest_dimension: string | null;
  weakest_dimension: string | null;
};

export type SkillDimension = CoachDimension & {
  explanation: string;
};

export type SkillsData = {
  dimensions: SkillDimension[];
  resume_skills: { name: string; level: number }[];
  strongest: string | null;
  weakest: string | null;
  recommended_topics: string[];
};

export type UserSkill = {
  id: string;
  name: string;
  level: number;
  proficiency: number;
  self_rated: boolean;
  last_assessed_at: string;
};

export type RoleOption = {
  name: string;
  description: string;
  required_count: number;
};

export type RoleRequirement = {
  requirement: string;
  weight: number;
  matched_skill: string | null;
  rating: number | null;
  rated: boolean;
};

export type RoleAssessment = {
  role: string;
  description: string;
  score: number;
  coverage: number;
  matched_count: number;
  required_count: number;
  readiness: string;
  skills: RoleRequirement[];
  missing_skills: string[];
  recommendations: string[];
};

export type SkillFocusArea = {
  skill: string;
  why: string;
  topics: string[];
  action: string;
};

export type SkillRecommendations = {
  role: string;
  summary: string;
  focus_areas: SkillFocusArea[];
  study_plan: string[];
  source: string;
};

export type CoachChatResponse = {
  reply: string;
};

export type JobAnalysis = {
  skills: string[];
  likely_questions: string[];
};

export type ResumeUploadResult = {
  id: string;
  file_name: string;
  skills: string[];
  parsed: Record<string, unknown>;
  created_at: string;
};

export type QuestionState = {
  bookmarked: boolean;
  completed: boolean;
};

export type QuestionListParams = {
  category?: string;
  difficulty?: string;
  search?: string;
  bookmarked?: boolean;
  completed?: boolean;
};

export function getToken(): string | null {
  // Tokens are stored in httpOnly cookies; kept for backwards compatibility.
  return null;
}

export function setAuth(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("copilot_user", JSON.stringify(user));
    localStorage.removeItem("copilot_token");
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("copilot_token");
  localStorage.removeItem("copilot_user");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("copilot_user");
  return raw ? JSON.parse(raw) : null;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : null;
}

function csrfHeaders(method: string): Record<string, string> {
  if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return {};
  const token = getCookie("copilot_csrf");
  return token ? { "X-CSRF-Token": token } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...csrfHeaders(method),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const isAuthRequest =
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/register") ||
    path === "/api/users/me";
  if (res.status === 401 && typeof window !== "undefined" && !isAuthRequest) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function questionQuery(params: QuestionListParams): string {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.search) query.set("search", params.search);
  if (params.bookmarked !== undefined) query.set("bookmarked", String(params.bookmarked));
  if (params.completed !== undefined) query.set("completed", String(params.completed));
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export const api = {
  register: (full_name: string, email: string, password: string) =>
    request<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  getMe: () => request<User>("/api/users/me"),
  updateProfile: (full_name: string) =>
    request<User>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ full_name }),
    }),
  adminUsers: () => request<AdminUser[]>("/api/admin/users"),
  providers: () => request<ProviderStatus[]>("/api/providers"),
  saveProvider: (provider: string, api_key: string, model: string) =>
    request<ProviderStatus>(`/api/providers/${provider}`, {
      method: "PUT",
      body: JSON.stringify({ api_key, model }),
    }),
  testProvider: (provider: string, api_key: string, model: string) =>
    request<ProviderTestResult>(`/api/providers/${provider}/test`, {
      method: "POST",
      body: JSON.stringify({ api_key, model }),
    }),
  deleteProvider: (provider: string) =>
    request<void>(`/api/providers/${provider}`, { method: "DELETE" }),
  uploadResume: async (file: File): Promise<ResumeUploadResult> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/resumes/upload`, {
      method: "POST",
      headers: { ...csrfHeaders("POST") },
      body: form,
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || "Upload failed");
    }
    return res.json();
  },
  analyzeJob: (title: string, company: string, description: string) =>
    request<JobAnalysis>("/api/jobs/analyze", {
      method: "POST",
      body: JSON.stringify({ title, company, description }),
    }),
  createInterview: (payload: {
    type: string;
    difficulty: string;
    title: string;
    question_count: number;
    duration_minutes: number;
  }) =>
    request<InterviewDetail>("/api/interviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listInterviews: () => request<Interview[]>("/api/interviews"),
  getInterview: (id: string) =>
    request<InterviewDetail>(`/api/interviews/${id}`),
  submitAnswer: (id: string, answer: string) =>
    request<InterviewDetail>(`/api/interviews/${id}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
  completeInterview: (id: string) =>
    request<InterviewDetail>(`/api/interviews/${id}/complete`, {
      method: "POST",
    }),
  questionDomains: () => request<QuestionDomain[]>("/api/questions/domains"),
  listQuestions: (params: QuestionListParams = {}) =>
    request<Question[]>(`/api/questions${questionQuery(params)}`),
  answerQuestion: (questionId: string, answer: string) =>
    request<QuestionAnswerResult>(`/api/questions/${questionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
  toggleBookmark: (questionId: string) =>
    request<QuestionState>(`/api/questions/${questionId}/bookmark`, {
      method: "POST",
    }),
  toggleComplete: (questionId: string) =>
    request<QuestionState>(`/api/questions/${questionId}/complete`, {
      method: "POST",
    }),
  copilotHint: (context: string, transcript: string) =>
    request<{
      suggestion: string;
      talking_points: string[];
      star_outline: Record<string, string>;
    }>("/api/copilot/hint", {
      method: "POST",
      body: JSON.stringify({ context, transcript }),
    }),
  dashboard: () => request<Dashboard>("/api/dashboard"),
  performance: (days: number | null) =>
    request<Performance>(`/api/dashboard/performance?days=${days ?? 0}`),
  skills: () => request<SkillsData>("/api/dashboard/skills"),
  userSkills: () => request<UserSkill[]>("/api/skills"),
  addSkill: (name: string, proficiency: number) =>
    request<UserSkill>("/api/skills", {
      method: "POST",
      body: JSON.stringify({ name, proficiency }),
    }),
  saveSkillRatings: (ratings: { skill_id: string; proficiency: number }[]) =>
    request<UserSkill[]>("/api/skills/ratings", {
      method: "PUT",
      body: JSON.stringify({ ratings }),
    }),
  roleCatalog: () => request<RoleOption[]>("/api/skills/roles"),
  assessRole: (role: string) =>
    request<RoleAssessment>(`/api/skills/assessment?role=${encodeURIComponent(role)}`),
  skillRecommendations: (role: string) =>
    request<SkillRecommendations>(
      `/api/skills/recommendations?role=${encodeURIComponent(role)}`
    ),
  recommendations: () => request<CoachInsights>("/api/dashboard/recommendations"),
  preparationGoals: () => request<PreparationGoal[]>("/api/preparation-goals"),
  createGoal: (payload: {
    company: string;
    role: string;
    interview_date: string | null;
    round: string;
    status: string;
    progress: number;
  }) =>
    request<PreparationGoal>("/api/preparation-goals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateGoal: (
    id: string,
    payload: Partial<{
      company: string;
      role: string;
      interview_date: string | null;
      round: string;
      status: string;
      progress: number;
    }>
  ) =>
    request<PreparationGoal>(`/api/preparation-goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteGoal: (id: string) =>
    request<void>(`/api/preparation-goals/${id}`, { method: "DELETE" }),
  coachChat: (
    message: string,
    history: { role: "user" | "assistant"; content: string }[]
  ) =>
    request<CoachChatResponse>("/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};



