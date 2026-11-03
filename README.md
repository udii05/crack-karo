<p align="center">
  <img src="frontend/public/crack-karo-logo.svg" alt="Crack Karo" width="300" />
</p>

<p align="center">
   AI-powered interview preparation for students and early-career engineers.
</p>

Crack Karo is a full-stack practice platform built around voice-first mock interviews. It generates interview questions, transcribes spoken answers, scores them across multiple dimensions, tracks readiness over time, and turns the results into a personalised practice plan.

The platform is designed around a **bring-your-own-key (BYOK)** model: users connect their own Gemini or OpenAI key, so the application can stay free while inference costs remain under the user's control.

[![CI](https://github.com/udii05/crack-karo/actions/workflows/ci.yml/badge.svg)](https://github.com/udii05/crack-karo/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15.1-000000?logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ready-4169E1?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)
![BYOK](https://img.shields.io/badge/AI-BYOK-3978e8)

---

## Table of contents

- [What it does](#what-it-does)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [BYOK and key security](#byok-and-key-security)
- [Database and migrations](#database-and-migrations)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security model](#security-model)
- [Current limitations and roadmap](#current-limitations-and-roadmap)
- [Contributing](#contributing)

---

## What it does

Interview practice usually gives people a score and little else. Crack Karo keeps the full loop:

1. Choose a role, interview type, difficulty, and session length.
2. The AI interviewer asks questions by voice.
3. The user answers by speaking.
4. Each answer is scored for relevance, structure, technical depth, and delivery.
5. The dashboard and coach turn those scores into a practice plan.
6. The question bank and skill assessment turn the plan into focused practice.

The app includes both a structured **Mock Interview** flow and a hands-free **Live Chat** interviewer. Live Chat currently uses the browser's Web Speech API for speech recognition and synthesis; it does not require server-side audio infrastructure.

---

## Features

### Mock interviews

- Behavioural and technical interview types.
- Beginner, intermediate, and advanced difficulty.
- Configurable question count and session duration.
- Voice-only answers with live transcription.
- Per-answer scoring across relevance, structure, technical accuracy, and delivery.
- STAR-oriented feedback for behavioural answers.
- Saved reports with question, answer, score, and improvement notes.

### Live Chat

- Hands-free AI interviewer.
- The interviewer speaks a question, opens the microphone automatically, and advances after the answer.
- Interview state and transcripts are stored as normal interview sessions.
- Chrome and Edge are supported.
- No raw audio is stored by default.

### Dashboard and analytics

- Readiness score based on interview volume, score quality, streak, and skill coverage.
- Average score, practice time, and current streak.
- Score trend filters for 7, 30, 90 days, and all time.
- Skill breakdown with strongest and weakest dimensions.
- Recent interview history with review actions.
- Preparation goals with progress tracking.
- Full analytics page with type breakdowns, interview frequency, and recurring weaknesses.

### Question bank

- 16 computer-science domains.
- 232 curated questions with difficulty levels.
- Domain cards with completed/total progress.
- Mic-based practice flow: record an answer, receive a score, and mark the question complete.
- Question attempts and best scores are stored per user.

### Skill assessment and role fit

- Generic role profiles such as Software Engineer, AI Engineer, ML Engineer, Data Scientist, Frontend, Backend, Full Stack, DevOps, Cybersecurity, Cloud, Data Engineer, Python, Java, QA, and Mobile.
- Resume upload for skill extraction.
- Self-rating with a four-step proficiency slider: Beginner, Intermediate, Skilled, Advanced.
- Role fit score with coverage, gaps, and recommendations.
- LLM-generated focus areas with specific study topics.
- Manual skill additions for requirements missing from a resume.
- Communication is intentionally excluded from self-rating; it is assessed through interviews.

### AI coach

- Insights derived from actual interview scores.
- Strongest and weakest dimensions.
- Recurring weaknesses.
- Recommended questions.
- Next-step plan.
- Follow-up chat grounded in the user's performance data.

### Job preparation

- Paste a job description.
- Reuse the existing resume upload and skill extraction.
- Identify missing skills.
- Generate likely interview questions.
- Create a preparation goal from the analysis.

### Admin

- Admin-only account directory.
- Name, email, role, and join date.
- Passwords and password hashes are never returned.
- Access is controlled by the server-side `ADMIN_EMAILS` allowlist.

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Client"]
        UI["Next.js UI<br/>Dashboard, interviews, settings"]
        Speech["Browser Web Speech API<br/>Speech-to-text / text-to-speech"]
        UI <--> Speech
    end

    Edge["Cloudflare<br/>DNS, TLS, WAF"]
    Frontend["Vercel / Cloudflare Pages<br/>Next.js frontend"]
    API["Oracle VM + Docker<br/>Caddy -> FastAPI<br/>REST, cookies, CSRF"]
    DB[("PostgreSQL<br/>Neon / Supabase")]
    Redis[("Redis<br/>shared rate limits")]
    Providers["BYOK provider gateway<br/>per-user encrypted keys"]
    Gemini["Google Gemini"]
    OpenAI["OpenAI"]
    Observability["Sentry + structured logs"]
    Backup[("Encrypted backups<br/>R2 / S3")]
    Realtime["Planned realtime gateway<br/>Gemini Live / OpenAI Realtime"]

    UI --> Edge --> Frontend --> API
    API --> DB
    API --> Redis
    API --> Providers
    Providers --> Gemini
    Providers --> OpenAI
    API --> Observability
    DB --> Backup
    API -. "next phase" .-> Realtime
    Realtime -.-> Gemini
    Realtime -.-> OpenAI
```

### Request flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Next.js
    participant A as FastAPI
    participant P as BYOK provider
    participant D as PostgreSQL

    U->>F: Start a mock interview
    F->>A: POST /api/interviews (httpOnly cookie + CSRF)
    A->>P: Generate questions with user's key
    P-->>A: Questions
    A->>D: Save interview and sessions
    A-->>F: Interview detail
    F-->>U: Speak question with browser TTS
    U->>F: Spoken answer
    F->>A: POST /api/interviews/{id}/answer
    A->>P: Score answer with user's key
    P-->>A: Score and feedback
    A->>D: Save answer and evaluation
    A-->>F: Updated interview
    F-->>U: Next question or final report
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, PyJWT |
| Database | SQLite for local development, PostgreSQL for production |
| Migrations | Alembic |
| AI providers | Google Gemini and OpenAI via a provider gateway |
| Voice | Browser Web Speech API (Chrome / Edge) |
| Caching and limits | Redis (optional locally, recommended in production) |
| Deployment | Docker, Docker Compose, Caddy, Oracle Always Free, Neon/Supabase |
| Observability | Sentry, structured request logs, health and readiness endpoints |
| CI | GitHub Actions |

---

## Quick start

### Prerequisites

- Python 3.13+
- Node.js 20+ (22 LTS recommended)
- npm
- Chrome or Edge for voice features
- Optional: PostgreSQL 16+ and Redis for a production-like setup

### 1. Clone the repository

```bash
git clone https://github.com/udii05/crack-karo.git
cd crack-karo
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set at minimum:

```env
SECRET_KEY=<long-random-string>
KEY_ENCRYPTION_KEY=<long-random-string>
ADMIN_EMAILS=your-admin-email@example.com
```

Start the backend:

```powershell
python run.py
```

The API runs at `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.

On macOS/Linux, activate with:

```bash
source .venv/bin/activate
```

### 3. Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### 4. Connect an AI provider

1. Sign in and open **Settings**.
2. Find **LLM Providers**.
3. Connect Google Gemini or OpenAI with your own API key.
4. Select the default model and save.

Keys are verified before saving. The platform does not simulate a successful connection.

If no user key is connected, the platform fallback key in `backend/.env` is used for development and demo access. For production, rely on BYOK.

---

## Configuration

All backend settings live in `backend/.env` and are documented in `backend/.env.example`.

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | development placeholder | Signs auth tokens. Use a long random value in production. |
| `KEY_ENCRYPTION_KEY` | derived from `SECRET_KEY` if empty | Encrypts saved BYOK keys. Set a dedicated value and back it up. |
| `DATABASE_URL` | `sqlite:///./data/copilot.db` | Use a PostgreSQL URL in production. |
| `ENVIRONMENT` | `development` | Set to `production` on the server. |
| `COOKIE_SECURE` | `false` | Set to `true` behind HTTPS. |
| `COOKIE_SAMESITE` | `lax` | Use `lax` for same-site subdomains. |
| `COOKIE_DOMAIN` | empty | Set to `.example.com` when frontend and API use different subdomains. |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed CORS origin. |
| `ADMIN_EMAILS` | project admin emails | Comma-separated admin allowlist. |
| `REDIS_URL` | empty | Shared rate limiting across API instances. |
| `SENTRY_DSN` | empty | Optional error monitoring. |
| `GEMINI_API_KEY` | empty | Platform fallback Gemini key. |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Default Gemini model. |
| `OPENAI_API_KEY` | empty | Platform fallback OpenAI key. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Default OpenAI model. |

`backend/.env` is ignored by Git. Never commit provider keys, encryption keys, or database files.

---

## BYOK and key security

Users bring their own Gemini or OpenAI key from **Settings → LLM Providers**.

How it works:

- The key is sent to the backend over HTTPS.
- The backend verifies it with a real provider request.
- The key is encrypted at rest with `KEY_ENCRYPTION_KEY`.
- The browser receives only a masked hint such as `****abcd`.
- The key is never logged, returned, or included in error output.
- Removing a provider key does not delete interview history.
- A user's key is used only for that user's sessions.
- The platform fallback is used only when the user has no provider key.

`KEY_ENCRYPTION_KEY` must remain stable. If it changes or is lost, saved BYOK keys cannot be decrypted and users must reconnect their keys. Accounts, interviews, and skills are unaffected.

Use the same `KEY_ENCRYPTION_KEY` on every backend instance. Otherwise, one instance cannot decrypt keys saved by another.

---

## Database and migrations

### Local development

The default `DATABASE_URL` uses SQLite at `backend/data/copilot.db`. In development, the backend creates and updates the SQLite schema automatically.

### Production PostgreSQL

Set:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST/DATABASE?sslmode=require
COOKIE_SECURE=true
```

Apply migrations once before starting the new backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
```

For later deployments, run `alembic upgrade head` again before starting the new version. Do not run migrations from every API replica at the same time.

Core tables include users, interviews, interview sessions, questions, question attempts, question progress, skills, provider keys, preparation goals, resumes, streaks, and copilot sessions.

---

## API overview

All user data routes require authentication. Cookie-authenticated writes require a CSRF token. Bearer-token authentication is supported for API clients and tests.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in and set auth cookies |
| `POST` | `/api/auth/logout` | Clear auth cookies |
| `GET` | `/api/users/me` | Current profile |
| `PATCH` | `/api/users/me` | Update display name |
| `POST` | `/api/resumes/upload` | Upload and parse a resume |
| `POST` | `/api/jobs/analyze` | Analyze a job description |
| `POST` | `/api/interviews` | Create and start an interview |
| `GET` | `/api/interviews` | Interview history |
| `GET` | `/api/interviews/{id}` | Interview detail and report |
| `POST` | `/api/interviews/{id}/answer` | Submit and score an answer |
| `POST` | `/api/interviews/{id}/complete` | Complete a session |
| `GET` | `/api/dashboard` | Dashboard overview |
| `GET` | `/api/dashboard/performance` | Score trend and type breakdown |
| `GET` | `/api/dashboard/skills` | Skill dimensions and resume skills |
| `GET` | `/api/dashboard/recommendations` | AI coach insights |
| `GET` | `/api/questions` | Filtered question list |
| `GET` | `/api/questions/domains` | Domain progress |
| `POST` | `/api/questions/{id}/answer` | Practice answer with mic transcript |
| `GET` | `/api/skills` | User skills |
| `PUT` | `/api/skills/ratings` | Save self-ratings |
| `GET` | `/api/skills/roles` | Generic role catalog |
| `GET` | `/api/skills/assessment?role=...` | Role fit assessment |
| `GET` | `/api/skills/recommendations?role=...` | LLM study recommendations |
| `GET` | `/api/providers` | BYOK provider status |
| `PUT` | `/api/providers/{provider}` | Connect or update a provider |
| `POST` | `/api/providers/{provider}/test` | Test a key |
| `DELETE` | `/api/providers/{provider}` | Remove a saved key |
| `POST` | `/api/coach/chat` | Performance-grounded coach chat |
| `GET` | `/api/admin/users` | Admin account directory |
| `GET` | `/api/health` | Liveness |
| `GET` | `/api/ready` | Database readiness |

---

## Project structure

```text
crack-karo/
├── backend/
│   ├── app/
│   │   ├── ai/              # Gemini, OpenAI, mock providers
│   │   ├── routers/         # Auth, interviews, questions, skills, providers, admin
│   │   ├── services/        # Analytics and coach insights
│   │   ├── byok.py          # Encrypted provider-key vault
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic contracts
│   │   └── main.py          # FastAPI application
│   ├── alembic/             # Database migrations
│   ├── tests/               # Auth, BYOK, and health tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Dashboard, settings, and UI components
│   ├── lib/                 # API client, auth, speech, preferences
│   └── package.json
├── deploy/
│   ├── docker-compose.yml
│   ├── Caddyfile
│   ├── backup.sh
│   └── README.md
├── docs/
├── .github/workflows/ci.yml
└── README.md
```

---

## Testing

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend:

```powershell
cd frontend
npx tsc --noEmit
npm run build
```

Deployment configuration:

```powershell
docker compose -f deploy/docker-compose.yml config --quiet
```

The test suite covers cookie authentication, CSRF enforcement, Bearer-token compatibility, BYOK encryption, health, and readiness.

---

## Deployment

The recommended zero-cost starting point is:

- **Frontend:** Vercel or Cloudflare Pages
- **Backend:** Oracle Always Free VM running Docker Compose
- **Database:** Neon or Supabase Postgres
- **Cache:** Redis on the Oracle VM
- **TLS / DNS:** Cloudflare + Caddy
- **Backups:** nightly `pg_dump` copied to R2 or S3
- **AI inference:** user-provided Gemini or OpenAI key

See [`deploy/README.md`](deploy/README.md) for the full deployment and backup procedure.

Production checklist:

- `ENVIRONMENT=production`
- Postgres `DATABASE_URL`
- `COOKIE_SECURE=true`
- stable `SECRET_KEY` and `KEY_ENCRYPTION_KEY`
- `REDIS_URL` configured
- `SENTRY_DSN` configured
- migrations applied
- backups copied off the server
- restore tested
- Oracle security list restricted to 22, 80, and 443
- no platform LLM key required for normal BYOK operation

A single Always Free VM is not highly available. Treat it as an early-stage host and keep deployment reproducible so it can be replaced quickly.

---

## Security model

- Passwords are hashed; password hashes are never returned.
- Auth uses httpOnly, Secure, SameSite cookies in production.
- CSRF protection is enforced for cookie-authenticated writes.
- Rate limits protect auth and API routes; Redis shares limits across instances.
- BYOK keys are encrypted at rest with a server-side master key.
- Provider keys are masked and never returned to the browser.
- Admin access is enforced server-side through `ADMIN_EMAILS`.
- User data is scoped to the authenticated user on every request.
- File uploads are limited in size and type.
- CORS is restricted to the configured frontend origin.
- Structured logs do not include secrets.
- `.env`, databases, logs, and build artifacts are ignored by Git.

---

## Current limitations and roadmap

- **Live Chat is browser-based voice.** It uses the Web Speech API and the existing interview engine. Native full-duplex Gemini Live or OpenAI Realtime audio is the next major module.
- **Only Gemini and OpenAI are supported as BYOK providers.** Custom provider endpoints and base URLs are not implemented yet.
- **No background job queue yet.** Interview scoring and resume parsing run in the request path.
- **No object storage yet.** Resumes are stored as extracted text; raw audio is not stored.
- **No multi-region or high-availability deployment yet.** The current architecture is scale-ready but runs as a modular monolith.
- **No billing or payments.** This is intentional.
- **Privacy and Terms pages are drafts pending legal review.**

Planned next steps:

1. Native Gemini Live / OpenAI Realtime gateway with barge-in.
2. Queue workers for long AI and parsing jobs.
3. Object storage with retention controls.
4. Load tests and multi-instance API deployment.
5. Formal AI evaluation suite and prompt regression tests.
6. Privacy, terms, and account data export/delete flows.

---

## Contributing

Issues and pull requests are welcome.

Before opening a pull request:

1. Keep the existing modular-monolith structure.
2. Add tests for backend behavior changes.
3. Run `pytest`, `npx tsc --noEmit`, and `npm run build`.
4. Never commit `.env` files, API keys, database files, or logs.
5. Include a clear description of the change and any migration impact.

---

Built as a free, student-focused interview practice platform with BYOK inference and a production-oriented foundation.


