# 02 — Brainstorming & Design

This document consolidates the design work produced during the brainstorm phase. Full artifacts live alongside it (see "Design Artifacts").

## 1. Core Features

| Layer | Feature |
|---|---|
| **Preparation** | Resume analyzer · JD analyzer · Question bank · Company research · Skill-gap assessment |
| **Mock Interviews** | Behavioral & technical tracks · Adaptive difficulty · Real-time feedback · Voice/video modes |
| **Live Copilot** | Real-time hints during real interviews · Discreet overlay · Voice/pace detection |
| **Feedback & Analytics** | Session scoring · Transcript review · Skill radar · Progress tracking |

## 2. User Journey

```
Onboarding → Profile setup (resume + JD) → Practice → Mock interview → Live Copilot → Review → Retention loop
```

Key retention hooks: daily streak, weekly progress report, readiness score.

## 3. Database Design

Production schema targets **PostgreSQL 16+** (see `schema.sql` in this folder):

- **Identity**: `users`, `user_preferences`
- **Ingestion**: `resumes`, `job_descriptions`, `candidate_profiles`
- **Skills**: `skills`, `user_skills`, `skill_assessments`
- **Questions**: `questions`, `company_questions` (with pgvector embeddings)
- **Interviews**: `interviews`, `interview_sessions`
- **Media**: `media_assets`, `feedback_reports`
- **Copilot**: `copilot_sessions`, `copilot_interactions`
- **Engagement**: `practice_runs`, `streaks`, `analytics_events`

**Design principles:** JSONB for flexible payloads, soft-deletes, RLS for multi-tenancy, `updated_at` triggers, enum types.

> The implemented MVP uses **SQLite** (zero-config) but the ORM models mirror this schema so swapping to Postgres is a config change.

## 4. Modern SaaS Architecture

Six layers (see `interview-copilot-architecture.drawio`):

1. **Clients** — Next.js web app, React Native mobile, browser extension
2. **Edge / API Gateway** — Cloudflare/AWS, WAF, rate limiting, Clerk/Auth0
3. **Application Services** — users, interviews, feedback
4. **AI Orchestration** — FastAPI orchestrator, LLM gateway, RAG/pgvector, STT/TTS
5. **Data Layer** — PostgreSQL, Redis (sessions/queues), S3 (media)
6. **External** — LLM providers, AWS infra

**Key decisions:** modular monolith first, streaming everywhere, LLM gateway for provider portability, cost caps + usage metering.

## 5. Dashboard Components

Overview (readiness + streak + radar) · Progress timeline · Practice hub · Interview reports · Company research · Live Copilot launcher · Settings.

## 6. AI Features

1. Question generation (role/JD-specific)
2. RAG knowledge base (resume + JD + company)
3. Speech-to-text (Whisper)
4. Voice analysis (filler words, pace, confidence)
5. Adaptive interviewer agent
6. Rubric-based answer scoring
7. Personalized feedback
8. Skill-gap detection
9. Readiness score
10. Live copilot hints

## 7. Future Improvements

Video body-language analysis · Peer mock interviews · ATS integrations · Mobile copilot (earbuds) · Expert marketplace · Multi-language · Gamification · White-label API.

## 8. Roadmap

| Phase | Timeline | Focus |
|---|---|---|
| 1 — MVP | 0–3 mo | Auth, resume/JD parse, question gen, voice mock interview, dashboard |
| 2 — Core Value | 3–6 mo | Voice mocks, transcripts, Live Copilot extension, company research |
| 3 — Growth | 6–12 mo | Video mocks, mobile, team plans, integrations, gamification |
| 4 — Scale | 12–18 mo | Marketplace, multi-language, white-label |

---

## Design Artifacts (in this folder)

| File | Description |
|---|---|
| `schema.sql` | Full PostgreSQL schema with RLS, triggers, pgvector |
| `dashboard-structure.md` | Next.js App Router component tree + data flow |
| `ai-orchestration.md` | AI agent pipeline, RAG flow, model strategy |
| `interview-copilot-architecture.drawio` / `.png` | Visual 6-layer architecture diagram |
