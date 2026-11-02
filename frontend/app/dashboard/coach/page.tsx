"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { CoachInsights, api } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why is my technical score lower than my other scores?",
  "How can I improve the structure of my answers?",
  "What should I practise next?",
];

export default function CoachPage() {
  const [insights, setInsights] = useState<CoachInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setInsights(await api.recommendations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load coaching insights.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    const history = [...messages];
    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    setError("");
    try {
      const result = await api.coachChat(message, history);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The coach could not reply.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !insights) {
    return (
      <div className="card flex flex-col items-start gap-3">
        <div className="text-sm font-semibold text-red-700">Could not load AI Coach</div>
        <p className="text-sm text-slate-500">{error}</p>
        <button type="button" onClick={() => void load()} className="btn-secondary btn-sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const practiceType = insights?.weakest?.key === "technical" ? "technical" : "behavioral";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="ic-page-head mb-0">
          <h1>AI Coach</h1>
          <p>Personalised feedback grounded in your actual interview scores.</p>
        </div>
        <Link
          href={`/dashboard/interview/new?type=${practiceType}&difficulty=intermediate`}
          className="btn-primary btn-sm"
        >
          Generate practice session
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          {insights && !insights.has_data ? (
            <EmptyState
              icon={Sparkles}
              title="Your coach needs a baseline"
              description={insights.summary}
              action={
                <Link href="/dashboard/interview/new" className="btn-primary btn-sm">
                  Start first interview
                </Link>
              }
            />
          ) : (
            insights && (
              <>
                <div className="card p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0edff] text-[#7962cf]">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    Coaching summary
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#7e8da2]">{insights.summary}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {insights.strongest && (
                    <div className="card p-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Strongest
                      </div>
                      <div className="mt-1.5 text-sm font-semibold text-slate-800">
                        {insights.strongest.label}
                      </div>
                      <div className="mt-0.5 text-2xl font-bold text-slate-900">
                        {insights.strongest.score}
                      </div>
                    </div>
                  )}
                  {insights.weakest && (
                    <div className="card p-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                        <Target className="h-3.5 w-3.5" />
                        Focus next
                      </div>
                      <div className="mt-1.5 text-sm font-semibold text-slate-800">
                        {insights.weakest.label}
                      </div>
                      <div className="mt-0.5 text-2xl font-bold text-slate-900">
                        {insights.weakest.score}
                      </div>
                    </div>
                  )}
                </div>

                {insights.recurring_mistakes.length > 0 && (
                  <div className="card">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <h2 className="text-sm font-bold text-ink-900">Recurring mistakes</h2>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {insights.recurring_mistakes.map((mistake) => (
                        <li key={mistake} className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.next_steps.length > 0 && (
                  <div className="card">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-brand-600" />
                      <h2 className="text-sm font-bold text-ink-900">Next steps</h2>
                    </div>
                    <ol className="mt-3 space-y-2">
                      {insights.next_steps.map((step, index) => (
                        <li key={step} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {insights.improved_skills.length > 0 && (
                  <div className="card">
                    <h2 className="text-sm font-bold text-ink-900">Improved skills</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {insights.improved_skills.map((skill) => (
                        <span key={skill.key} className="badge bg-emerald-50 text-emerald-700">
                          {skill.label} +{skill.delta}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </div>

        <div className="card flex h-[640px] flex-col p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold text-ink-900">Interview Coach</div>
                <div className="text-[11px] text-slate-400">Grounded in your performance data</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMessages([])}
              className="text-xs font-medium text-slate-400 hover:text-slate-700"
              disabled={messages.length === 0}
            >
              Clear chat
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm leading-relaxed text-slate-600">
                  Ask about a score, a recurring mistake, or what to practise next.
                  I will use your completed interviews as context.
                </p>
                <div className="mt-3 space-y-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <User className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Reviewing your performance...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-5 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your performance..."
              aria-label="Message the AI coach"
              className="input h-10 flex-1 py-2"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
