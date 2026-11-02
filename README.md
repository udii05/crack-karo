# AI Interview Copilot

A production-ready SaaS MVP for AI-powered interview preparation with mock interviews, voice interaction, real-time scoring, and a live copilot for actual interviews.

![Python](https://img.shields.io/badge/Python-3.14+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.139-green) ![Next.js](https://img.shields.io/badge/Next.js-15.1-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

---

## Features

### AI Mock Interviews
- **Behavioral & Technical** interview types with configurable difficulty (beginner / intermediate / advanced)
- **Voice Mode** â€” AI interviewer reads questions aloud (text-to-speech); candidates answer by voice (speech-to-text transcription)
- **Content-Aware Scoring** â€” evaluates relevance, structure, technical depth, and delivery (not just word count)
- **Per-Answer Feedback** â€” dimension scores (Relevance, Structure, Technical, Delivery) with targeted improvement tips
- **STAR Framework** â€” behavioral questions scored against Situation-Task-Action-Result structure

### Live Chat
- Hands-free AI interviewer: speaks the question, listens, and advances automatically
- Chrome/Edge browser speech, with transcript saved into the interview report
- Optional BYOK realtime provider upgrade path (Gemini Live / OpenAI Realtime)

### Dashboard & Analytics
- **Readiness Score** (0â€“100) updated after every interview
- **Streak Tracker** â€” consecutive days of practice
- **Skill Radar** â€” strengths and gaps across interview-relevant skills
- **Recent Interviews** â€” quick access to past sessions and reports

### Resume & Job Description Analysis
- Upload resume (PDF/TXT) for skill extraction
- Enter job description â†’ AI generates tailored likely interview questions

### Question Bank
- Browse categorized questions (behavioral, technical) with difficulty levels and hints

---

## Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Next.js 15  â”‚â”€â”€â”€â”€â–¶â”‚  FastAPI     â”‚â”€â”€â”€â”€â–¶â”‚  SQLite      â”‚
â”‚  (Port 3000) â”‚â—€â”€â”€â”€â”€â”‚  (Port 8000) â”‚â—€â”€â”€â”€â”€â”‚  (SQLAlchemy)â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     React 19          Pydantic              Database
     TypeScript         PyJWT                 Models
     Tailwind CSS       Uvicorn
```

- **Backend**: FastAPI + SQLAlchemy + SQLite (zero-config, file-based)
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Auth**: JWT-based (register / login / protected routes)
- **AI Provider**: Pluggable â€” Gemini (set `GEMINI_API_KEY`), OpenAI (set `OPENAI_API_KEY`), or a local mock provider when no key is configured

---

## Quick Start

### Prerequisites
- **Python 3.14+**
- **Node.js 18+** and **npm**
- **Chrome or Edge** (for voice interview features â€” Web Speech API)

### 1. Clone & Install

```bash
cd interview-copilot

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Start the Servers

```bash
# Terminal 1 â€” Backend (port 8000)
cd backend
python run.py

# Terminal 2 â€” Frontend (port 3000)
cd frontend
npm run dev
```

### 3. Open the App

Navigate to **http://localhost:3000** in Chrome or Edge.

1. Click **Get started** â†’ Register with any email/password
2. You'll land on the **Dashboard**
3. Click **New Interview** â†’ Configure type, difficulty, number of questions
4. Click **Start interview** â†’ the interviewer reads each question aloud
5. Tap the large microphone circle, speak your answer, then tap it again to stop and score it automatically
6. Review your scored report after completion

---

## Project Structure

```
interview-copilot/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ main.py              # FastAPI app & CORS config
â”‚   â”‚   â”œâ”€â”€ config.py            # Settings (env vars, JWT secret)
â”‚   â”‚   â”œâ”€â”€ database.py          # SQLAlchemy engine & session
â”‚   â”‚   â”œâ”€â”€ models.py            # User, Interview, InterviewSession, Skill, Streak
â”‚   â”‚   â”œâ”€â”€ schemas.py           # Pydantic request/response models
â”‚   â”‚   â”œâ”€â”€ security.py          # Password hashing, JWT tokens
â”‚   â”‚   â”œâ”€â”€ deps.py              # Auth dependency (get_current_user)
â”‚   â”‚   â”œâ”€â”€ ai/
â”‚   â”‚   â”‚   â”œâ”€â”€ provider.py      # Pluggable AI interface + provider selection
â”‚   â”‚   â”‚   â”œâ”€â”€ gemini_provider.py # Gemini REST provider (real analysis)
â”‚   â”‚   â”‚   â”œâ”€â”€ openai_provider.py
â”‚   â”‚   â”‚   â”œâ”€â”€ mock.py          # Deterministic mock (no API key needed)
â”‚   â”‚   â”‚   â””â”€â”€ errors.py        # Provider error type
â”‚   â”‚   â””â”€â”€ routers/
â”‚   â”‚       â”œâ”€â”€ auth.py          # POST /api/auth/register, /api/auth/login
â”‚   â”‚       â”œâ”€â”€ interviews.py    # CRUD interviews, answer, complete
â”‚   â”‚       â”œâ”€â”€ dashboard.py     # GET /api/dashboard
â”‚   â”‚       â”œâ”€â”€ copilot.py       # POST /api/copilot/hint
â”‚   â”‚       â”œâ”€â”€ questions.py     # GET /api/questions
â”‚   â”‚       â””â”€â”€ users.py         # Resume upload + job analysis
â”‚   â”œâ”€â”€ run.py                   # Entry point (uvicorn on :8000)
â”‚   â”œâ”€â”€ .env.example             # AI keys and configuration template
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â””â”€â”€ e2e_test.py              # End-to-end API test
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ page.tsx             # Landing page
â”‚   â”‚   â”œâ”€â”€ layout.tsx           # Root layout with AuthProvider
â”‚   â”‚   â”œâ”€â”€ login/page.tsx
â”‚   â”‚   â”œâ”€â”€ register/page.tsx
â”‚   â”‚   â””â”€â”€ dashboard/
â”‚   â”‚       â”œâ”€â”€ page.tsx         # Dashboard (readiness, streak, skills)
â”‚   â”‚       â”œâ”€â”€ interview/
â”‚   â”‚       â”‚   â”œâ”€â”€ page.tsx     # Interview list
â”‚   â”‚       â”‚   â”œâ”€â”€ new/page.tsx # New interview (voice-only answers)
â”‚   â”‚       â”‚   â””â”€â”€ [id]/page.tsx # Interview detail & report
â”‚   â”‚       â”œâ”€â”€ practice/page.tsx
â”‚   â”‚       â”œâ”€â”€ skills/page.tsx
â”‚   â”‚       â””â”€â”€ copilot/page.tsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ VoiceInterview.tsx   # Mic circle, live transcript, auto-submit
â”‚   â”‚   â”œâ”€â”€ ReadinessGauge.tsx
â”‚   â”‚   â”œâ”€â”€ ResumeUpload.tsx
â”‚   â”‚   â””â”€â”€ StatCard.tsx
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ api.ts               # API client (fetch wrapper, auth headers)
â”‚   â”‚   â”œâ”€â”€ auth.tsx             # Auth context (login state, JWT)
â”‚   â”‚   â””â”€â”€ useSpeech.ts        # Web Speech API hook (TTS + STT)
â”‚   â””â”€â”€ package.json
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ 01-original-ask.md       # Product vision & scope
â”‚   â”œâ”€â”€ 02-brainstorming.md      # Architecture decisions
â”‚   â”œâ”€â”€ 03-implementation.md     # Build log & implementation details
â”‚   â””â”€â”€ 04-user-guide.md         # End-user documentation
â”œâ”€â”€ schema.sql                   # PostgreSQL schema (reference)
â”œâ”€â”€ dashboard-structure.md       # Dashboard component breakdown
â”œâ”€â”€ ai-orchestration.md          # AI scoring & flow design
â””â”€â”€ interview-copilot-architecture.drawio
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, get JWT |
| `GET` | `/api/dashboard` | Dashboard metrics |
| `GET` | `/api/interviews` | List interviews |
| `POST` | `/api/interviews` | Create interview |
| `GET` | `/api/interviews/{id}` | Interview detail + sessions |
| `POST` | `/api/interviews/{id}/answer` | Submit answer, get AI score |
| `POST` | `/api/interviews/{id}/complete` | Finalize interview |
| `GET` | `/api/questions` | Browse question bank |
| `POST` | `/api/copilot/hint` | Get live copilot hints |
| `POST` | `/api/resumes/upload` | Upload resume (PDF/TXT) |
| `POST` | `/api/jobs/analyze` | Analyze job description |

---

## Voice Interview (Web Speech API)

The voice interview uses the **Web Speech API** (no API key required):

- **Text-to-Speech (TTS)** â€” AI interviewer reads questions aloud
- **Speech-to-Text (STT)** â€” Candidate answers by voice; the live transcript appears below the mic
- **One-Tap Recording** â€” Tap the circle to start, tap again to stop and submit for scoring
- **Auto-Speak** â€” Each new question is read automatically when it appears

> **Browser Support**: Chrome, Edge (Chromium-based). Firefox has limited support. Safari partial support.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | _(empty)_ | If set, uses Gemini for all AI analysis (highest priority) |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Gemini model used for analysis |
| `OPENAI_API_KEY` | _(empty)_ | Optional fallback if Gemini is not configured |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model used for analysis |
| `SECRET_KEY` | `dev-secret-change-me-in-production` | JWT/cookie signing key |
| `KEY_ENCRYPTION_KEY` | _(derived from SECRET_KEY)_ | Encrypts user BYOK provider keys at rest. Set a separate long random value in production. |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `ADMIN_EMAILS` | `udita.chakraborty05@gmail.com,asmita.chakrab@gmail.com` | Comma-separated allowlist for the admin account directory. Passwords are never returned. |
| `DATABASE_URL` | `sqlite:///./data/copilot.db` | Use Postgres in production |
| `ENVIRONMENT` | `development` | Set to `production` on the server |
| `COOKIE_SECURE` | `false` | Set to `true` behind HTTPS |
| `COOKIE_SAMESITE` | `lax` | Use `none` only for unrelated frontend/API domains with HTTPS |
| `COOKIE_DOMAIN` | _(empty)_ | Set to `.example.com` when frontend and API use different subdomains, so the CSRF cookie is readable |
| `REDIS_URL` | _(empty)_ | Shared rate limits and multi-instance coordination |
| `SENTRY_DSN` | _(empty)_ | Error monitoring |

### Connect Gemini

1. Create an API key in Google AI Studio.
2. Copy `backend/.env.example` to `backend/.env` and set:

```bash
GEMINI_API_KEY="your-key"
GEMINI_MODEL=gemini-3.5-flash
```

3. Restart the backend. `GET /api/health` reports the active provider as `gemini`.

Gemini takes priority over OpenAI. With neither key set, the app uses the **deterministic mock provider** â€” fully functional offline with keyword-based scoring.

---

## Testing

```bash
cd backend
python e2e_test.py
```

Runs: register â†’ dashboard â†’ interview creation â†’ answer submission â†’ scoring â†’ completion â†’ copilot â†’ question bank. Exits with `=== ALL E2E CHECKS PASSED ===`.

---

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/01-original-ask.md`](docs/01-original-ask.md) | Product vision, target users, scope |
| [`docs/02-brainstorming.md`](docs/02-brainstorming.md) | Architecture decisions, trade-offs |
| [`docs/03-implementation.md`](docs/03-implementation.md) | Build log, API contracts, deployment |
| [`docs/04-user-guide.md`](docs/04-user-guide.md) | End-user guide with screenshots |
| [`schema.sql`](schema.sql) | PostgreSQL schema (reference) |
| [`ai-orchestration.md`](ai-orchestration.md) | AI scoring dimensions & flow |
| [`interview-copilot-architecture.drawio`](interview-copilot-architecture.drawio) | Visual architecture diagram |

---

## License

MIT



