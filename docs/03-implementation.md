# 03 — Implementation

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.14 · FastAPI · SQLAlchemy · Pydantic · JWT (PyJWT) · Uvicorn |
| **Database** | SQLite (dev, zero-config) — Postgres-swappable via `DATABASE_URL` |
| **AI Provider** | Pluggable `ai/` — Gemini via `GEMINI_API_KEY`, OpenAI via `OPENAI_API_KEY`, or a mock fallback when no key is configured |
| **Frontend** | Next.js 15 (App Router) · TypeScript · Tailwind CSS · fetch-based API client |
| **Auth** | JWT bearer tokens, bcrypt-style password hashing (pbkdf2_hmac from stdlib) |

## Repository Layout

```
interview-copilot/
├── README.md                     # run instructions
├── docs/
│   ├── 01-original-ask.md
│   ├── 02-brainstorming.md
│   ├── 03-implementation.md      # this file
│   └── 04-user-guide.md
├── backend/
│   ├── requirements.txt
│   ├── run.py
│   ├── app/
│   │   ├── main.py               # FastAPI app + CORS + router registration
│   │   ├── database.py           # engine + session + init
│   │   ├── models.py             # SQLAlchemy ORM (mirrors Postgres schema)
│   │   ├── schemas.py            # Pydantic request/response models
│   │   ├── security.py           # password hashing + JWT
│   │   ├── deps.py               # get_db / get_current_user
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── provider.py       # provider interface + resolver
│   │   │   ├── mock.py           # deterministic mock AI
│   │   │   └── openai_provider.py# optional real LLM
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── resumes.py
│   │       ├── interviews.py
│   │       ├── questions.py
│   │       ├── copilot.py
│   │       └── dashboard.py
│   └── data/                     # SQLite db (gitignored)
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind config
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx              # landing
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   └── dashboard/
    │       ├── layout.tsx        # app shell + sidebar
    │       ├── page.tsx          # overview
    │       ├── interview/page.tsx
    │       ├── interview/new/page.tsx
    │       ├── interview/[id]/page.tsx
    │       ├── practice/page.tsx
    │       ├── skills/page.tsx
    │       └── copilot/page.tsx
    ├── components/               # dashboard components
    ├── lib/
    │   ├── api.ts                # API client + auth token storage
    │   └── auth.tsx              # AuthProvider context
    └── styles/globals.css
```

## Backend Design

### Auth flow
`POST /api/auth/register` → creates user (hashed password) → returns JWT.
`POST /api/auth/login` → validates → returns JWT + user.
All `/api/*` routes except auth require `Authorization: Bearer <token>` (FastAPI dependency).

### Core endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/me` | Current profile |
| POST | `/api/resumes/upload` | Upload + parse resume (multipart) |
| POST | `/api/jobs/analyze` | Analyze a job description |
| GET | `/api/questions` | Question bank (filter by type/difficulty) |
| POST | `/api/interviews` | Create an interview session |
| POST | `/api/interviews/{id}/answer` | Submit answer, get AI score + feedback |
| POST | `/api/interviews/{id}/complete` | Finish, generate report, update readiness |
| GET | `/api/interviews` | History |
| GET | `/api/interviews/{id}` | Detail + report |
| POST | `/api/copilot/hint` | Real-time copilot hint |
| GET | `/api/dashboard` | Readiness, streak, skills, recent interviews |

### AI provider abstraction

```python
class AIProvider(Protocol):
    def generate_question(self, ctx) -> dict: ...
    def score_answer(self, question, answer, ctx) -> dict: ...
    def extract_skills(self, text) -> list: ...
    def copilot_hint(self, context, transcript) -> str: ...
```

- **GeminiProvider** (`ai/gemini_provider.py`): real AI analysis when `GEMINI_API_KEY` is set. Uses the Gemini REST API directly, so no extra SDK is required.
- **OpenAIProvider** (`ai/openai_provider.py`): optional real LLM when `OPENAI_API_KEY` is set.
- **MockProvider** (`ai/mock.py`): deterministic templates so the app works offline with zero config.

Gemini is selected first when both keys are present. Provider failures return HTTP 502 with a readable error instead of a generic 500.

### Scoring model
Each answer is scored 0–100 across: relevance (35%), structure (25%), technical accuracy (25%), delivery (15%). The mock provider uses keyword heuristics; Gemini and OpenAI use a rubric prompt and return per-dimension scores plus actionable weaknesses.

### Readiness score
Derived from: interview count, average score, streak, skill coverage. Updated on interview completion.

## Frontend Design

- Next.js App Router; `AuthProvider` (React context) stores JWT in `localStorage`.
- `lib/api.ts` wraps `fetch`, injects `Authorization`, redirects to `/login` on 401.
- **Dashboard pages**: overview (readiness gauge, streak, recent interviews), interview (create/list/run), practice (question bank), skills (radar list), copilot (live hint overlay).
- Styling: Tailwind utility classes, minimal custom CSS.

## Security Notes (MVP)
- Passwords hashed with PBKDF2-HMAC-SHA256 (stdlib).
- JWT signed with HMAC secret (`SECRET_KEY` env, dev fallback).
- CORS restricted to frontend origin.
- **Production hardening** (out of scope for MVP): Postgres + RLS, refresh tokens, rate limiting, Stripe webhooks, credential storage in KMS, LLM cost caps.

## Running

See `README.md` for exact commands. TL;DR:
1. Backend: `pip install -r backend/requirements.txt` then `python backend/run.py` (port 8000).
2. Frontend: `npm install` then `npm run dev` in `frontend/` (port 3000).
3. Open http://localhost:3000, register, upload a resume, run a mock interview.
