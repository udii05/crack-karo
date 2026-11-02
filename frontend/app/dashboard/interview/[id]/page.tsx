"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Mic,
  PlayCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import { InterviewDetail, api } from "@/lib/api";
import {
  formatDate,
  formatMinutes,
  scoreTone,
  statusLabel,
  statusTone,
} from "@/lib/format";
import ScoreRing from "@/components/ui/ScoreRing";
import ProgressBar from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";

const DIMENSION_LABELS: Record<string, string> = {
  relevance: "Answer Relevance",
  structure: "Structure",
  technical: "Technical Accuracy",
  delivery: "Delivery",
};

function dimensionTone(value: number): "emerald" | "brand" | "amber" {
  if (value >= 75) return "emerald";
  if (value >= 50) return "brand";
  return "amber";
}

export default function InterviewDetailPage() {
  const params = useParams<{ id: string }>();
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!params.id) return;
    setLoading(true);
    setError("");
    try {
      setInterview(await api.getInterview(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load interview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="card flex flex-col items-start gap-3">
        <div className="text-sm font-semibold text-red-700">Could not load this interview</div>
        <p className="text-sm text-slate-500">{error}</p>
        <button type="button" onClick={() => void load()} className="btn-secondary btn-sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const answered = interview.sessions.filter((session) => session.score !== null);
  const avg =
    answered.length > 0
      ? Math.round(answered.reduce((sum, session) => sum + (session.score || 0), 0) / answered.length)
      : null;
  const overall = interview.overall_score ?? avg ?? 0;
  const report = interview.report as {
    summary?: string;
    strongest_dimension?: string;
  };
  const duration = interview.actual_duration_minutes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/interview" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Interview History
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{interview.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="capitalize">{interview.type}</span>
            <span className="text-slate-300">|</span>
            <span className="capitalize">{interview.difficulty}</span>
            <span className="text-slate-300">|</span>
            <span>{formatDate(interview.created_at)}</span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {duration !== null ? formatMinutes(duration) : `${formatMinutes(interview.duration_minutes)} planned`}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${statusTone(interview.status)}`}>
            {statusLabel(interview.status)}
          </span>
          {interview.status === "in_progress" && (
            <Link href={`/dashboard/interview/new?resume=${interview.id}`} className="btn-primary btn-sm">
              <PlayCircle className="h-4 w-4" />
              Continue interview
            </Link>
          )}
          <Link href="/dashboard/interview/new" className="btn-secondary btn-sm">
            <Mic className="h-3.5 w-3.5" />
            New interview
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_2fr]">
        <div className="card flex flex-col items-center justify-center text-center">
          <ScoreRing value={overall} size={148} label="Overall score" />
          <div className="mt-3 text-xs text-slate-500">
            Based on {answered.length} scored {answered.length === 1 ? "answer" : "answers"}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{answered.length}/{interview.sessions.length}</div>
            <div className="mt-1 text-xs text-slate-500">Questions answered</div>
          </div>
          <div className="card">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="h-4 w-4" />
            </div>
            <div className="mt-3 text-base font-semibold capitalize text-slate-900">
              {report.strongest_dimension ? DIMENSION_LABELS[report.strongest_dimension] || report.strongest_dimension : "-"}
            </div>
            <div className="mt-1 text-xs text-slate-500">Strongest dimension</div>
          </div>
          <div className="card">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Target className="h-4 w-4" />
            </div>
            <div className="mt-3 text-base font-semibold text-slate-900">{overall >= 75 ? "On track" : "Keep practising"}</div>
            <div className="mt-1 text-xs text-slate-500">Readiness signal</div>
          </div>
        </div>
      </div>

      {report.summary && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
            <CheckCircle2 className="h-4 w-4" />
            Report summary
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{report.summary}</p>
        </div>
      )}

      <div className="space-y-4">
        {interview.sessions.map((session, index) => (
          <div key={session.id} className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                  {index + 1}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Question</span>
              </div>
              <span className={`inline-flex min-w-10 justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${scoreTone(session.score)}`}>
                {session.score !== null ? session.score : "-"}
              </span>
            </div>
            <p className="mt-3 font-medium leading-relaxed text-slate-800">{session.question}</p>

            {session.user_answer ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                {session.user_answer}
              </div>
            ) : (
              <p className="mt-3 text-sm italic text-slate-400">Not answered yet</p>
            )}

            {session.feedback?.summary && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{session.feedback.summary}</p>
            )}

            {session.feedback?.dimensions && Object.keys(session.feedback.dimensions).length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(session.feedback.dimensions).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{DIMENSION_LABELS[key] || key}</span>
                      <span className="text-slate-500">{value}</span>
                    </div>
                    <ProgressBar value={Number(value)} tone={dimensionTone(Number(value))} className="mt-1.5" />
                  </div>
                ))}
              </div>
            )}

            {session.feedback?.weaknesses && session.feedback.weaknesses.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertCircle className="h-3.5 w-3.5" />
                  What to improve
                </div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-800">
                  {session.feedback.weaknesses.map((weakness, weaknessIndex) => (
                    <li key={weaknessIndex}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Link href="/dashboard/interview/new" className="btn-primary">
          Start another interview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
