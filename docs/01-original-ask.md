# 01 — Original Ask

## Product Vision

> "I want to build a production-ready AI Interview Copilot SaaS."

### Target Users
1. **Students** — preparing for internships / first jobs
2. **Job Seekers** — actively interviewing, want targeted prep
3. **Working Professionals** — career switches, senior roles, promotions

### Explicit Requirements (as requested by the founder)

- **Core Features** — feature set for the product
- **User Journey** — the end-to-end product experience
- **Database Design** — the persistence layer
- **Modern SaaS Architecture** — how the system is built
- **Dashboard Components** — the UI surfaces
- **AI Features** — the intelligence layer
- **Future Improvements** — the longer-term roadmap
- **Product Roadmap** — a clean, scalable build plan

### Follow-up Requests
1. "Go deeper" → produce the PostgreSQL schema, Next.js dashboard structure, AI orchestration flow, and a visual architecture diagram (draw.io).
2. **Build a working SaaS application** implementing the design as an executable MVP.

---

## Scope of the Implementation Deliverable

| Area | Implemented? | Notes |
|---|---|---|
| User auth (register / login / JWT) | Yes | FastAPI + JWT, password hashing |
| Resume upload + AI parsing | Yes | Text extraction + AI skill extraction |
| Job Description ingest | Yes | AI skill and question mapping |
| Mock interview (behavioral / technical) | Yes | Voice interviewer with scoring and feedback |
| Live Copilot | Yes | Hint endpoint and discreet result panel |
| Dashboard (readiness, skills, history) | Yes | Aggregated metrics, analytics, and coaching |
| Postgres / RLS / pgvector | Partial | Runs on SQLite for zero-config; models map to the Postgres schema in `docs/design` |
| Real LLM calls | Optional | Gemini or OpenAI when a key is configured; mock fallback by default |

---

## Success Criteria
- The application **runs** with a single command (backend + frontend).
- A user can register, upload a resume, run a mock interview, get scored feedback, and see a dashboard.
- Documentation exists for the original ask, the design decisions, the implementation, and end users.
