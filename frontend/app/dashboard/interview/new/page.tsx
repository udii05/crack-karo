"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Mic,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { InterviewDetail, api } from "@/lib/api";
import { getPreferences } from "@/lib/preferences";
import { formatMinutes } from "@/lib/format";
import VoiceInterview from "@/components/VoiceInterview";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Stage = "config" | "running" | "done";

const ROLES = [
  "AI Engineer",
  "Software Engineer",
  "Python Developer",
  "Machine Learning Engineer",
  "HR / Behavioural Interview",
  "Product Manager",
];

function firstUnanswered(interview: InterviewDetail): number {
  const index = interview.sessions.findIndex(
    (session) => session.user_answer === "" && session.score === null
  );
  return index;
}

export default function NewInterviewPage() {
  const router = useRouter();
  const booted = useRef(false);
  const [stage, setStage] = useState<Stage>("config");
  const [type, setType] = useState<"behavioral" | "technical">("behavioral");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate"
  );
  const [role, setRole] = useState("Software Engineer");
  const [questionCount, setQuestionCount] = useState(3);
  const [duration, setDuration] = useState(30);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const preferences = getPreferences();
    setType(preferences.defaultType);
    setDifficulty(preferences.defaultDifficulty);
    setQuestionCount(preferences.defaultQuestionCount);
    setDuration(preferences.defaultDuration);
    setAutoSpeak(preferences.autoSpeak);

    const params = new URLSearchParams(window.location.search);
    const queryType = params.get("type");
    const queryDifficulty = params.get("difficulty");
    const queryRole = params.get("role");
    const queryDuration = params.get("duration");
    if (queryType === "technical" || queryType === "behavioral") setType(queryType);
    if (
      queryDifficulty === "beginner" ||
      queryDifficulty === "intermediate" ||
      queryDifficulty === "advanced"
    ) {
      setDifficulty(queryDifficulty);
    }
    if (queryRole) setRole(queryRole);
    if (queryDuration && Number(queryDuration) >= 5) setDuration(Number(queryDuration));

    const resumeId = params.get("resume");
    if (resumeId) {
      setLoading(true);
      api
        .getInterview(resumeId)
        .then((result) => {
          if (result.status === "completed") {
            router.replace(`/dashboard/interview/${result.id}`);
            return;
          }
          const next = firstUnanswered(result);
          setInterview(result);
          setRole(result.title);
          setType(result.type === "technical" ? "technical" : "behavioral");
          setDuration(result.duration_minutes);
          if (next === -1) {
            setStage("done");
          } else {
            setCurrent(next);
            setStage("running");
          }
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Could not resume interview.")
        )
        .finally(() => setLoading(false));
    }
  }, [router]);

  useEffect(() => {
    if (stage !== "running" || !interview) return;
    const end =
      new Date(interview.created_at).getTime() + interview.duration_minutes * 60 * 1000;
    const update = () => {
      setSecondsLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [stage, interview]);

  async function startInterview() {
    setLoading(true);
    setError("");
    try {
      const created = await api.createInterview({
        type,
        difficulty,
        title: role,
        question_count: questionCount,
        duration_minutes: duration,
      });
      setInterview(created);
      setStage("running");
      setCurrent(0);
      setShowHint(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start interview.");
    } finally {
      setLoading(false);
    }
  }

  const session = interview?.sessions[current];

  async function handleAnswer(transcript: string) {
    if (!interview) return;
    setLoading(true);
    setError("");
    try {
      const updated = await api.submitAnswer(interview.id, transcript);
      setInterview(updated);
      const next = firstUnanswered(updated);
      if (next === -1) {
        setStage("done");
      } else {
        setCurrent(next);
        setShowHint(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not score this answer.");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    if (!interview) return;
    setLoading(true);
    setError("");
    try {
      const updated = await api.completeInterview(interview.id);
      router.push(`/dashboard/interview/${updated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete interview.");
      setLoading(false);
    }
  }

  function reset() {
    setInterview(null);
    setStage("config");
    setCurrent(0);
    setError("");
    setSecondsLeft(null);
  }

  if (stage === "config") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard/interview" className="inline-flex items-center gap-1 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Interview History
          </Link>
        </div>

        <div className="ic-page-head">
          <h1>Mock Interview</h1>
          <p>Configure a voice session. The AI interviewer reads each question and scores your spoken answer.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="card space-y-6">
          <div>
            <label className="label" htmlFor="role">Target role</label>
            <select
              id="role"
              className="input"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="label">Interview type</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "behavioral", title: "Behavioural", copy: "STAR stories, collaboration, ownership." },
                { value: "technical", title: "Technical", copy: "Depth, trade-offs, and problem solving." },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value as "behavioral" | "technical")}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    type === option.value
                      ? "border-brand-500 bg-brand-50/60"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{option.title}</span>
                    {type === option.value && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{option.copy}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                className="input"
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as "beginner" | "intermediate" | "advanced")
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="duration">Session duration</label>
              <select
                id="duration"
                className="input"
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
              >
                {[15, 30, 45, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="question-count">Number of questions</label>
              <input
                id="question-count"
                type="number"
                min={1}
                max={10}
                className="input"
                value={questionCount}
                onChange={(event) =>
                  setQuestionCount(Math.max(1, Math.min(10, Number(event.target.value) || 1)))
                }
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(event) => setAutoSpeak(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Read questions aloud automatically
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            This interview is voice-only. Tap the microphone circle to start recording,
            then tap it again to stop and send your answer for scoring. Use Chrome or Edge
            and allow microphone access.
          </div>

          <button type="button" onClick={startInterview} disabled={loading} className="btn-primary w-full">
            <Mic className="h-4 w-4" />
            {loading ? "Preparing your interviewer..." : "Start interview"}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "running" && interview && session) {
    const answeredCount = interview.sessions.filter((item) => item.user_answer !== "").length;
    const progress = Math.round((answeredCount / interview.sessions.length) * 100);
    const minutes = Math.floor((secondsLeft ?? 0) / 60);
    const seconds = (secondsLeft ?? 0) % 60;
    const timeLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/dashboard/interview" className="inline-flex items-center gap-1 hover:text-slate-800">
                <ArrowLeft className="h-4 w-4" />
                Exit
              </Link>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{interview.title}</h1>
            <p className="text-sm capitalize text-slate-500">
              {interview.type} - {interview.difficulty} - {formatMinutes(interview.duration_minutes)} planned
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${secondsLeft !== null && secondsLeft <= 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
              <Clock3 className="h-3.5 w-3.5" />
              {secondsLeft === null ? "No timer" : secondsLeft <= 0 ? "Time is up" : timeLabel}
            </span>
            <button type="button" onClick={() => setFinishOpen(true)} className="btn-secondary btn-sm">
              Finish session
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Question {Math.min(current + 1, interview.sessions.length)} of {interview.sessions.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {secondsLeft !== null && secondsLeft <= 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            The planned session time has elapsed. You can finish now or submit the remaining answers.
          </div>
        )}

        <div className="card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-brand-50 text-brand-700">AI Interviewer</span>
            <span className="badge bg-slate-100 text-slate-600 capitalize">{interview.type}</span>
            <span className="badge bg-slate-100 text-slate-600 capitalize">{interview.difficulty}</span>
          </div>
          <p className="mt-4 text-lg font-medium leading-relaxed text-slate-900">{session.question}</p>
          {session.feedback?.hint && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowHint((value) => !value)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showHint ? "Hide hint" : "Show hint"}
              </button>
              {showHint && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {session.feedback.hint}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <VoiceInterview
            question={session.question}
            autoSpeak={autoSpeak}
            disabled={loading}
            onAnswer={handleAnswer}
          />
        </div>

        <ConfirmDialog
          open={finishOpen}
          title="Finish this interview?"
          description="You can finish before answering every question. Your report will use the answers submitted so far."
          confirmLabel="Finish and review"
          busy={loading}
          onClose={() => setFinishOpen(false)}
          onConfirm={() => void finish()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="card space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Interview complete</h1>
        <p className="text-sm text-slate-500">
          {interview
            ? `You answered ${interview.sessions.filter((item) => item.user_answer).length} of ${interview.sessions.length} questions. Your report is ready.`
            : "Your report is ready."}
        </p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={() => void finish()} disabled={loading} className="btn-primary">
            {loading ? "Finalizing..." : "View my report"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={reset} className="btn-secondary">
            <RotateCcw className="h-4 w-4" />
            Start another
          </button>
        </div>
      </div>
    </div>
  );
}
