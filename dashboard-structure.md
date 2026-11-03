# Crack Karo — Next.js Dashboard Structure

Stack: **Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · WebSocket (live copilot)**

---

## 1. Project Layout

```
src/
├── app/
│   ├── (marketing)/              # Landing, blog (public)
│   │   ├── page.tsx
│   │   └── blog/
│   ├── (auth)/                   # Sign-in / Sign-up
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              # Protected, app shell
│   │   ├── layout.tsx            # AppShell + auth guard + sidebar
│   │   ├── page.tsx              # Overview / Home
│   │   ├── interview/
│   │   │   ├── page.tsx          # Interview history list
│   │   │   ├── new/page.tsx      # Configure + launch interview
│   │   │   └── [id]/page.tsx     # Live interview session
│   │   ├── report/
│   │   │   └── [id]/page.tsx     # Post-interview report
│   │   ├── practice/
│   │   │   ├── page.tsx          # Practice hub
│   │   │   └── question/[id]/page.tsx
│   │   ├── skills/
│   │   │   └── page.tsx          # Skill radar + assessments
│   │   ├── companies/
│   │   │   └── page.tsx          # Company research + saved JDs
│   │   ├── copilot/
│   │   │   └── page.tsx          # Live Copilot launcher/status
│   │   └── settings/
│   │       └── page.tsx          # Profile, resume, notifications
│   ├── api/                      # Route handlers (BFF)
│   │   ├── auth/                 # NextAuth / Clerk handlers
│   │   ├── interviews/
│   │   ├── uploads/              # Presigned S3 URLs
│   │   ├── ai/                   # Proxy to AI orchestration layer
│   │   └── copilot/ws            # WebSocket upgrade route
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn primitives (button, card, dialog…)
│   ├── dashboard/
│   │   ├── app-shell.tsx         # Sidebar + topbar + mobile nav
│   │   ├── sidebar-nav.tsx
│   │   ├── topbar.tsx
│   │   └── page-header.tsx
│   ├── overview/
│   │   ├── readiness-score-card.tsx
│   │   ├── streak-card.tsx
│   │   ├── skill-radar.tsx
│   │   ├── progress-chart.tsx
│   │   ├── next-steps.tsx
│   │   └── recent-interviews.tsx
│   ├── interview/
│   │   ├── interview-config-form.tsx
│   │   ├── interviewer-panel.tsx      # AI avatar/question stream
│   │   ├── answer-input.tsx           # one-tap mic capture + live transcript
│   │   ├── session-timer.tsx
│   │   └── interview-list.tsx
│   ├── report/
│   │   ├── score-overview.tsx
│   │   ├── metrics-panel.tsx          # filler words, pace, confidence
│   │   ├── transcript-timeline.tsx
│   │   ├── feedback-list.tsx
│   │   └── skill-impact.tsx
│   ├── practice/
│   │   ├── daily-challenge-card.tsx
│   │   ├── question-bank.tsx
│   │   └── quiz-runner.tsx
│   ├── skills/
│   │   ├── skill-radar-chart.tsx
│   │   └── gap-list.tsx
│   ├── copilot/
│   │   ├── copilot-launcher.tsx
│   │   ├── live-suggestions.tsx        # real-time hint stream
│   │   └── discreet-toolbar.tsx
│   └── shared/
│       ├── chart.tsx                   # Recharts wrapper
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       └── error-boundary.tsx
├── lib/
│   ├── api-client.ts             # typed fetch + TanStack Query hooks
│   ├── ws.ts                     # WebSocket client for copilot/session
│   ├── auth.ts
│   ├── analytics.ts              # PostHog/Mixpanel wrapper
│   └── utils.ts                  # cn() etc.
├── stores/
│   ├── interview-store.ts        # Zustand: live session state
│   ├── copilot-store.ts
│   └── ui-store.ts
└── types/
    ├── api.d.ts
    └── models.d.ts               # mirrors DB entities
```

---

## 2. App Shell

```
┌───────────────────────────────────────────────────────────┐
│ Topbar: [logo] [search] [avatar]                           │
├───────────┬───────────────────────────────────────────────┤
│ Sidebar   │  <Outlet />  — routed page content             │
│  Overview │                                                 │
│  Interview │   Loaders → skeletons → data → error fallback  │
│  Practice  │                                                 │
│  Skills    │                                                 │
│  Companies │                                                 │
│  Copilot   │                                                 │
│  Settings  │                                                 │
└───────────┴───────────────────────────────────────────────┘
```

**AppShell responsibilities:** auth guard, responsive sidebar (mobile drawer), WebSocket reconnection for active sessions.

---

## 3. Dashboard (Overview) Page — Component Data Flow

```
page.tsx (Server Component)
 ├─ await getServerSession()           → auth guard
 ├─ parallel data fetching (Promise.all):
 │    ├─ getReadiness(userId)          → readiness score + delta
 │    ├─ getStreak(userId)
 │    ├─ getSkillOverview(userId)      → radar data
 │    ├─ getRecentInterviews(userId)   → last 5
 │    └─ getNextSteps(userId)          → AI-suggested actions
 └─ renders <DashboardGrid> with each card (hydration-ready)
```

Every card is a **server-fetched initial state + TanStack Query client refetch** for freshness.

---

## 4. Live Interview Session — Key Components

| Component | Role |
|---|---|
| `interviewer-panel.tsx` | Streams AI questions, shows progress (Q 3 of 8), adaptive difficulty indicator |
| `answer-input.tsx` | Mode switch: text / microphone (MediaRecorder) / camera (getUserMedia) |
| `session-timer.tsx` | Countdown + elapsed, auto-advance |
| `ws.ts` client | Receives question events, sends answer chunks, receives real-time feedback events |
| `interview-store.ts` | Zustand: current question, transcript buffer, status machine (`idle → answering → awaiting_feedback → next`) |

**Sequence:**

```
User clicks Start → POST /api/interviews (creates row, config)
→ WS connect → server pushes {type:'question', payload}
→ User answers → chunked upload/stream
→ server emits {type:'feedback', score, talkingPoints}
→ ... loop until {type:'completed'} → redirect to /report/:id
```

---

## 5. Live Copilot — Discreet Mode Component

```
copilot-store.ts (Zustand)
 ├─ session state (active/ended)
 ├─ mode: full | discreet | voice
 ├─ suggestionQueue[]
 └─ visibility (draggable overlay, keyboard shortcut toggles)

live-suggestions.tsx
 └─ subscribes to WS 'copilot:suggestion' events
    └─ renders newest talking point / STAR outline in overlay
discreet-toolbar.tsx
 └─ minimal pill: [● rec] [hint] [score]
```

**Discreet design:** small draggable overlay, blurred with low opacity, shortcut `Cmd/Ctrl+K` to toggle, "tap-and-hold to peek" interaction for on-camera safety.

---

## 6. Report Page — Data Composition

```
report/[id]/page.tsx
 ├─ getInterview(id) → overall_score, metrics, media
 ├─ getSessions(id)  → per-question answers + feedback
 ├─ getSkillImpact(id)
 ├─ client components:
 │   ├─ score-overview.tsx        → big radial gauge + delta badge
 │   ├─ metrics-panel.tsx         → filler words, pace WPM, confidence bars
 │   ├─ transcript-timeline.tsx   → clickable timeline w/ audio replay
 │   ├─ feedback-list.tsx         → per-question strengths/improvements
 │   └─ skill-impact.tsx          → radar change vs previous
 └─ CTA: "Book next interview" / "Review again"
```

---

## 7. Reusable Data Layer (TanStack Query)

```ts
// lib/api-client.ts
export const api = {
  interviews: { list: (p) => q(['interviews', p]), create: ..., get: (id) => q(['interview', id]) },
  reports:    { get: (id) => q(['report', id]) },
  skills:     { overview: (uid) => q(['skills', uid]), radar: (uid) => q(['skills/radar', uid]) },
};
```

**Caching strategy:** stale-while-revalidate, invalidate `['interview']` on report generation, optimistic updates for practice scores.

---

## 8. Security & Performance Notes

- Server Components for initial data → no waterfall, reduced client bundle
- **Streaming AI responses** via `ReadableStream` + Suspense
- All API routes authenticated via Clerk/NextAuth JWT; RLS enforced at DB
- File uploads use **S3 presigned URLs** (never proxy large media through Node)
- Route segments for interview/report are lazy-loaded (`dynamic = 'force-dynamic'`)
