import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Mic,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice mock interviews",
    body: "Speak your answers naturally. The interviewer reads each question and your transcript is scored automatically.",
  },
  {
    icon: BarChart3,
    title: "Performance analytics",
    body: "Track score trends, practice time, interview frequency, and technical versus behavioural performance.",
  },
  {
    icon: Sparkles,
    title: "Personal AI coach",
    body: "Get recommendations grounded in your actual answers, not generic interview advice.",
  },
  {
    icon: BookOpen,
    title: "Curated question bank",
    body: "Browse twelve preparation categories, bookmark weak areas, and mark questions as practised.",
  },
  {
    icon: Briefcase,
    title: "Job preparation",
    body: "Paste a job description and resume to identify missing skills, likely questions, and a preparation roadmap.",
  },
  {
    icon: Target,
    title: "Skill assessment",
    body: "See your strongest and weakest answer dimensions with concrete topics to practise next.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Set up your target",
    body: "Choose a role, interview type, difficulty, session duration, and the number of questions.",
  },
  {
    number: "02",
    title: "Practice out loud",
    body: "Tap the microphone, answer naturally, and stop when you are done. The answer is scored instantly.",
  },
  {
    number: "03",
    title: "Review and improve",
    body: "Use your report, skill breakdown, and AI coach to decide exactly what to practise next.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-ink-900">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-[12px]">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-[36px] w-[36px]" />
            <span>
              <span className="block text-[26px] font-bold leading-[36px] tracking-[-0.5px]">
                Crack <span className="text-brand-600">Karo</span>
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#65748a] md:flex">
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600">How it works</a>
            <a href="#preview" className="hover:text-brand-600">Product</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost btn-sm">Log in</Link>
            <Link href="/register" className="btn-primary btn-sm">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-40 h-[460px] w-[460px] rounded-full border border-[#dbe8fb] shadow-[0_0_0_50px_rgba(255,255,255,0.35),0_0_0_110px_rgba(255,255,255,0.2)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe8fb] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#4778c8]">
                <Sparkles className="h-3.5 w-3.5" />
                AI interview preparation, built around you
              </div>
              <h1 className="mt-5 max-w-xl text-[38px] font-bold leading-[1.08] tracking-[-1.8px] text-[#172b49] sm:text-[52px]">
                Walk into your next interview with a plan.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#667a98]">
                Practice with a voice-first AI interviewer, see exactly where your answers
                are strong, and get a coaching plan grounded in your real performance.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary px-5 py-3">
                  Start practising free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn-secondary px-5 py-3">
                  Log in to your workspace
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#7e8da2]">
                {["Voice-only practice", "Real answer scoring", "Personalised coaching"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16856b]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div id="preview" className="relative">
              <div className="absolute inset-4 rounded-[28px] bg-[#eaf2ff]" />
              <div className="relative rounded-[22px] border border-[#e2ebfb] bg-white p-4 shadow-[0_24px_60px_rgba(25,48,82,0.12)]">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <BrandMark className="h-7 w-7" />
                    <span className="text-[17px] font-bold leading-[28px]">
                      Crack <span className="text-brand-600">Karo</span>
                    </span>
                  </div>
                  <span className="rounded-full bg-[#f1f5fb] px-2 py-1 text-[9px] font-semibold text-[#73839a]">
                    Product preview
                  </span>
                </div>

                <div className="mt-3 rounded-xl bg-[linear-gradient(110deg,#edf4ff,#f8faff)] p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-[1.4px] text-[#8b98ab]">
                        Readiness
                      </div>
                      <div className="mt-1 text-2xl font-bold tracking-[-0.8px] text-[#203c68]">72</div>
                      <div className="mt-0.5 text-[10px] text-[#7e8da2]">On track for your target</div>
                    </div>
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-[conic-gradient(#3978e8_0_72%,#dce7f7_72%_100%)]">
                      <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#f2f6ff]">
                        <TrendingUp className="h-4 w-4 text-brand-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Average score", value: "74 / 100" },
                    { label: "Practice time", value: "3h 20m" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-line p-3">
                      <div className="text-[9px] text-[#9aa6b6]">{item.label}</div>
                      <div className="mt-0.5 text-sm font-bold text-ink-900">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-ink-900">Skill breakdown</div>
                    <div className="text-[9px] text-brand-600">View all</div>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {[
                      ["Communication", 88],
                      ["Technical", 76],
                      ["Relevance", 81],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[72px_1fr_22px] items-center gap-2">
                        <span className="text-[9px] text-[#687991]">{label}</span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-[#eff3f8]">
                          <span
                            className="block h-full rounded-full bg-[#6c9aee]"
                            style={{ width: `${value}%` }}
                          />
                        </span>
                        <span className="text-right text-[9px] font-bold text-[#52647d]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[1.8px] text-brand-600">
              Everything in one workspace
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-[-1px] text-[#172b49] sm:text-4xl">
              Prepare with evidence, not guesswork.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#667a98]">
              Every feature is connected to your actual practice data, so you always know
              what to work on next.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="card p-5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-ink-900">{feature.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#7e8da2]">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[1.8px] text-brand-600">
                  How it works
                </div>
                <h2 className="mt-3 text-3xl font-bold tracking-[-1px] text-[#172b49]">
                  A simple practice loop.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#667a98]">
                  Set up a session, speak your answer, and leave with a specific next step.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {STEPS.map((step) => (
                  <div key={step.number} className="rounded-[18px] border border-line bg-[#fbfcfe] p-5">
                    <div className="text-xs font-bold text-brand-600">{step.number}</div>
                    <h3 className="mt-3 text-sm font-bold text-ink-900">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#7e8da2]">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-[22px] border border-[#e2ebfb] bg-[linear-gradient(110deg,#edf4ff_0%,#f5f8ff_62%,#f0f6ff_100%)] px-6 py-10 sm:px-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[#dbe8fb] shadow-[0_0_0_35px_rgba(255,255,255,0.3)]"
            />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.8px] text-[#172b49] sm:text-3xl">
                  Your next interview starts with one practice session.
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#667a98]">
                  Create a free workspace and run your first voice mock interview in minutes.
                </p>
              </div>
              <Link href="/register" className="btn-primary shrink-0 px-5 py-3">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 text-xs text-[#8b98aa] sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <span className="text-[15px] font-bold leading-[24px]">
              Crack <span className="text-brand-600">Karo</span>
            </span>
          </div>
          <div>Structured practice for calmer, stronger interviews.</div>
        </div>
      </footer>
    </div>
  );
}



