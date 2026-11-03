# Crack Karo — AI Orchestration Flow

The AI layer is a **separate service** (FastAPI or Node) behind the API gateway, consuming jobs from a queue and streaming results back over WebSocket/SSE. It is the only component that talks to LLM providers.

---

## 1. High-Level Pipeline

```
┌────────────┐   ┌──────────────┐   ┌──────────────────────────────┐
│  Client    │──▶│  API Gateway │──▶│  AI Orchestrator (FastAPI)   │
│ (Next.js)  │   │  (auth, RLS) │   │  ┌────────────────────────┐  │
└────────────┘   └──────────────┘   │  │ Router / Agent Manager │  │
                                    │  └───────────┬────────────┘  │
                                    │              │               │
                                    │  ┌───────────▼────────────┐  │
                                    │  │ LLM Gateway (multi-    │  │
                                    │  │ provider, retries,     │  │
                                    │  │ fallback, cost caps)   │  │
                                    │  └───────────┬────────────┘  │
                                    │              │               │
                                    │  ┌───────────▼────────────┐  │
                                    │  │ RAG / Vector Store     │  │
                                    │  │ (pgvector embeddings)  │  │
                                    │  └────────────────────────┘  │
                                    └──────────────────────────────┘
```

---

## 2. Core AI Agents

| Agent | Responsibility | Model strategy |
|---|---|---|
| **Profile Builder** | Resume + JD → skill map, gaps, summary | Structured output (JSON schema) |
| **Question Generator** | Role/JD/company → tailored questions + rubrics | LLM + RAG over question bank |
| **Interviewer Agent** | Runs the live mock: asks, listens, adapts, follows up | Streaming LLM + state machine |
| **Scorer** | Rubric-based scoring of each answer | LLM + deterministic rules |
| **Feedback Writer** | Natural-language critique + recommendations | LLM |
| **Voice Analyzer** | Filler words, pace, pitch, confidence | Whisper STT + DSP metrics |
| **Copilot Agent** | Real-time discreet hints during live interview | Low-latency LLM, streaming |
| **Readiness Predictor** | Predicts readiness from history + skill levels | Heuristic + optional ML |

---

## 3. Mock Interview Flow (Sequence)

```
User            Orchestrator        LLM Gateway        RAG/Vector        DB
 │  start()          │                   │                  │              │
 │──────────────────▶│  load profile     │                  │              │
 │                   │──────────────────▶│                  │              │
 │                   │  embed query      │─────────────────▶│              │
 │                   │  retrieve ctx     │◀─────────────────│              │
 │                   │  gen question     │──────────────────▶│              │
 │                   │◀──────────────────│                  │              │
 │  {question}       │                   │                  │              │
 │◀──────────────────│                   │                  │              │
 │  answer (stream)  │                   │                  │              │
 │──────────────────▶│  STT (if voice)   │                  │              │
 │                   │  score answer     │──────────────────▶│              │
 │                   │◀──────────────────│                  │              │
 │                   │  persist session  │───────────────────────────────▶│
 │  {feedback,next}  │                   │                  │              │
 │◀──────────────────│                   │                  │              │
```

**State machine per interview:** `awaiting_question → awaiting_answer → scoring → next_question → completed`. Orchestrator holds state in Redis so it survives restarts.

---

## 4. RAG Knowledge Pipeline

```
Ingestion (offline, async):
  Resume / JD / Company data
        │
        ▼
  Chunking (semantic, ~500 tokens)
        │
        ▼
  Embeddings (text-embedding-3-small / bge)
        │
        ▼
  pgvector (hnsw index)  ──▶  retrieval on each question gen
```

**Retrieval strategy:** hybrid search (vector cosine + keyword/BM25) with re-ranking; top-k = 5–8 chunks injected into the prompt as grounded context. This keeps answers **company/JD-specific** and reduces hallucination.

---

## 5. Live Copilot — Low-Latency Path

```
User (real interview) → browser extension / mobile
        │  audio or text
        ▼
   STT (Whisper, streaming) ──▶ transcript buffer
        │
        ▼
   Copilot Agent (fast model, e.g. gpt-4o-mini / claude-haiku)
        │  context: live transcript + candidate profile + JD
        ▼
   Streaming suggestion (talking points / STAR outline / hint)
        │
        ▼
   WebSocket push → discreet overlay
```

**Latency budget:** < 1.5s end-to-end. Uses a fast model + streaming + pre-warmed connection. Cost-capped per session via `copilot_sessions.tokens_used`.

---

## 6. Scoring Rubric (deterministic + LLM hybrid)

Each answer scored 0–100 across weighted dimensions:

| Dimension | Weight | Source |
|---|---|---|
| Relevance to question | 35% | LLM rubric match |
| Structure (STAR / clarity) | 25% | LLM |
| Technical accuracy | 25% | LLM + rubric key points |
| Delivery (pace, filler, confidence) | 15% | Voice analyzer (deterministic) |

Final = weighted sum; stored on `interview_sessions.score` and rolled up to `interviews.overall_score`.

---

## 7. Cost & Reliability Controls

- **LLM Gateway** — provider abstraction, automatic retry, fallback provider, per-request token caps
- **Request caps** — limit output tokens and answer length to control AI cost
- **Streaming everywhere** — no long blocking requests; SSE/WebSocket for UX
- **Idempotency** — job IDs prevent duplicate scoring
- **Observability** — token usage, latency, cost per request logged to analytics; Sentry for errors
- **Guardrails** — PII redaction on transcripts, content moderation on user answers, rate limiting per user

---

## 8. Model Selection Strategy

| Task | Model tier | Why |
|---|---|---|
| Question gen / profile | Frontier (gpt-4o / claude-sonnet) | Quality, structured output |
| Interviewer (live) | Frontier + streaming | Realism, low latency |
| Copilot hints | Small (haiku / gpt-4o-mini) | Speed + cost |
| STT | Whisper (local or API) | Accuracy |
| TTS | ElevenLabs / OpenAI TTS | Natural voice |
| Embeddings | text-embedding-3-small | Cost-efficient RAG |

**Design principle:** keep the LLM provider swappable behind the gateway so you can A/B test and switch providers without changing callers.