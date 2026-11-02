"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Trophy,
  Volume2,
} from "lucide-react";
import { InterviewDetail, api } from "@/lib/api";
import { useSpeech } from "@/lib/useSpeech";

type Phase = "idle" | "starting" | "speaking" | "listening" | "processing" | "done";

function firstUnanswered(interview: InterviewDetail): number {
  return interview.sessions.findIndex(
    (session) => session.user_answer === "" && session.score === null
  );
}

export default function LiveChatPage() {
  const router = useRouter();
  const {
    recognitionSupported,
    synthesisSupported,
    isSpeaking,
    isListening,
    transcript,
    error: speechError,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeech();

  const [phase, setPhase] = useState<Phase>("idle");
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [lastAnswer, setLastAnswer] = useState("");
  const submittingRef = useRef(false);

  const session = interview?.sessions[current];

  function beginListening() {
    setError("");
    resetTranscript();
    startListening();
    setPhase("listening");
  }

  function beginQuestion(question: string) {
    setError("");
    resetTranscript();
    setPhase("speaking");
    speak(question);
  }

  // After the interviewer finishes speaking, automatically open the mic.
  useEffect(() => {
    if (phase !== "speaking") return;
    const timer = window.setTimeout(() => {
      if (!isSpeaking && !submittingRef.current) {
        beginListening();
      }
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isSpeaking]);

  // When recognition ends after the user speaks, send the final transcript.
  useEffect(() => {
    if (phase !== "listening" || isListening || submittingRef.current) return;
    const text = transcript.trim();
    if (text) {
      submittingRef.current = true;
      void submitAnswer(text).finally(() => {
        submittingRef.current = false;
      });
    } else {
      setPhase("idle");
      setError("No speech detected. Press Resume listening and try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript, phase]);

  async function startInterview() {
    if (!recognitionSupported) return;
    setPhase("starting");
    setError("");
    try {
      const created = await api.createInterview({
        type: "behavioral",
        difficulty: "intermediate",
        title: "Live Interview",
        question_count: 5,
        duration_minutes: 30,
      });
      setInterview(created);
      setCurrent(0);
      beginQuestion(created.sessions[0].question);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the live interview.");
      setPhase("idle");
    }
  }

  async function submitAnswer(text: string) {
    if (!interview) return;
    setLastAnswer(text);
    setPhase("processing");
    setError("");
    try {
      const updated = await api.submitAnswer(interview.id, text);
      setInterview(updated);
      const next = firstUnanswered(updated);
      if (next === -1 || updated.status === "completed") {
        setPhase("done");
      } else {
        setCurrent(next);
        beginQuestion(updated.sessions[next].question);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse this answer.");
      setPhase("idle");
    }
  }

  async function finishInterview() {
    if (!interview) return;
    setPhase("processing");
    setError("");
    stopSpeaking();
    try {
      const updated = await api.completeInterview(interview.id);
      router.push(`/dashboard/interview/${updated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete the interview.");
      setPhase("idle");
    }
  }

  function reset() {
    stopSpeaking();
    void stopListening();
    resetTranscript();
    setInterview(null);
    setCurrent(0);
    setError("");
    setPhase("idle");
  }

  const statusLabel =
    phase === "speaking"
      ? "Interviewer is speaking"
      : phase === "listening"
        ? "Listening to you"
        : phase === "processing"
          ? "Analysing your answer"
          : phase === "starting"
            ? "Starting interview"
            : phase === "done"
              ? "Interview complete"
              : "Ready";

  if (phase === "done" && interview) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink-900">Interview complete</h1>
          <p className="mt-1 text-sm text-slate-500">
            The live interviewer finished the session and saved your report.
          </p>
          <div className="mt-4 text-3xl font-bold text-brand-700">
            {interview.overall_score ?? "-"}
            <span className="text-sm font-medium text-slate-400"> / 100</span>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href={`/dashboard/interview/${interview.id}`} className="btn-primary">
              View full report
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={reset} className="btn-secondary">
              <RotateCcw className="h-4 w-4" />
              Start another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="ic-page-head">
        <h1>Live Chat</h1>
        <p>
          A hands-free AI interviewer. It speaks, listens, and moves to the next
          question automatically.
        </p>
      </div>

      {(error || speechError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || speechError}
        </div>
      )}

      {!interview ? (
        <div className="card">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Mic className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink-900">Start a live interview</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Once you start, the interviewer asks five behavioural questions. Speak
                naturally. When you pause, the answer is transcribed and analysed, then
                the next question is read automatically.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line bg-[#fbfcfe] p-4 text-xs leading-relaxed text-slate-500">
            Use Chrome or Edge and allow microphone access. Audio is not stored. Your
            answer transcript is saved with the interview report.
          </div>

          <button
            type="button"
            onClick={() => void startInterview()}
            disabled={!recognitionSupported || phase === "starting"}
            className="btn-primary mt-4 w-full"
          >
            {phase === "starting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {phase === "starting" ? "Starting interviewer..." : "Start live interview"}
          </button>

          {!recognitionSupported && (
            <p className="mt-3 text-center text-xs text-amber-700">
              Speech recognition is not available in this browser. Use Chrome or Edge.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${
                  phase === "listening" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"
                }`}>
                  {phase === "listening" ? (
                    <Mic className="h-4 w-4 animate-pulse" />
                  ) : phase === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <div className="text-sm font-bold text-ink-900">{statusLabel}</div>
                  <div className="text-xs text-slate-400">
                    Question {current + 1} of {interview.sessions.length}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void finishInterview()}
                disabled={phase === "processing"}
                className="btn-secondary btn-sm"
              >
                <Square className="h-3.5 w-3.5" />
                End interview
              </button>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand-600 transition-all"
                style={{
                  width: `${Math.round(
                    (interview.sessions.filter((item) => item.user_answer).length /
                      interview.sessions.length) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Interviewer
            </div>
            <p className="mt-2 text-lg font-medium leading-relaxed text-ink-900">
              {session?.question}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <Sparkles className="h-4 w-4 text-brand-600" />
                Live transcript
              </div>
              {phase === "listening" && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                  Recording
                </span>
              )}
            </div>
            <p
              className={`mt-3 min-h-[5rem] text-sm leading-relaxed ${
                transcript ? "text-slate-700" : "italic text-slate-400"
              }`}
            >
              {transcript || "Your answer will appear here as you speak."}
              {phase === "listening" && transcript && (
                <span className="ml-0.5 inline-block animate-pulse text-brand-600">|</span>
              )}
            </p>
          </div>

          {phase === "idle" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={beginListening} className="btn-primary flex-1">
                <Mic className="h-4 w-4" />
                Resume listening
              </button>
              {lastAnswer && (
                <button
                  type="button"
                  onClick={() => void submitAnswer(lastAnswer)}
                  className="btn-secondary flex-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry analysis
                </button>
              )}
            </div>
          )}

          {phase === "speaking" && !synthesisSupported && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Text-to-speech is unavailable in this browser. Read the question above.
            </div>
          )}

          <p className="text-center text-[11px] text-slate-400">
            The interviewer pauses while you speak. Stop talking for a moment to send
            your answer. Use Chrome or Edge.
          </p>
        </>
      )}
    </div>
  );
}

