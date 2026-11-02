"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeech } from "@/lib/useSpeech";

interface VoiceInterviewProps {
  /** The question the AI interviewer should speak. */
  question: string;
  /** Auto-play the question as soon as it renders (default true). */
  autoSpeak?: boolean;
  /** Called with the final transcript when the answer is ready to score. */
  onAnswer: (transcript: string) => Promise<void> | void;
  /** When true, the mic is disabled (e.g. while the interview is being created). */
  disabled?: boolean;
}

type Phase = "idle" | "recording" | "stopping" | "ready" | "sending";

/**
 * Voice-only answer control. The candidate taps the large mic once to start
 * recording, speaks, then taps again to stop. The final transcript is handed
 * to the parent for scoring.
 */
export default function VoiceInterview({
  question,
  autoSpeak = true,
  onAnswer,
  disabled = false,
}: VoiceInterviewProps) {
  const {
    recognitionSupported,
    synthesisSupported,
    isSpeaking,
    isListening,
    transcript,
    error: speechError,
    speak,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeech();

  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState("");
  const [recorded, setRecorded] = useState("");
  const [localError, setLocalError] = useState("");

  const phaseRef = useRef<Phase>("idle");
  const isListeningRef = useRef(false);
  const transcriptRef = useRef("");
  const manualStopRef = useRef(false);
  const mountedRef = useRef(true);
  const lastQuestionRef = useRef<string | null>(null);
  const prevListeningRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isListeningRef.current = isListening;
    transcriptRef.current = transcript;
    if (isListening) setDisplay(transcript);
  }, [isListening, transcript]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A new question resets the answer control and speaks the question.
  useEffect(() => {
    if (!question || lastQuestionRef.current === question) return;
    lastQuestionRef.current = question;

    if (isListeningRef.current) {
      manualStopRef.current = true;
      void stopListening().finally(() => {
        manualStopRef.current = false;
      });
    }

    resetTranscript();
    setDisplay("");
    setRecorded("");
    setLocalError("");
    setPhase("idle");

    if (autoSpeak && synthesisSupported) speak(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, autoSpeak, synthesisSupported]);

  // If the browser ends recognition on its own (e.g. after a pause), keep the
  // transcript and let the next tap send it instead of losing the answer.
  useEffect(() => {
    const justEnded = prevListeningRef.current && !isListening;
    prevListeningRef.current = isListening;
    if (!justEnded || manualStopRef.current) return;
    if (phaseRef.current !== "recording") return;

    const final = transcript.trim();
    if (final) {
      setDisplay(final);
      setRecorded(final);
      setPhase("ready");
      setLocalError("");
    } else {
      setPhase("idle");
      setLocalError(
        speechError || "No speech detected. Press the microphone and try again."
      );
    }
  }, [isListening, transcript, speechError]);

  useEffect(() => {
    if (speechError && phaseRef.current === "recording" && !isListeningRef.current) {
      setPhase("idle");
    }
  }, [speechError]);

  function startRecording() {
    if (!recognitionSupported) return;
    setLocalError("");
    setRecorded("");
    setDisplay("");
    resetTranscript();
    transcriptRef.current = "";
    manualStopRef.current = false;
    setPhase("recording");
    startListening();
  }

  async function finishRecording() {
    manualStopRef.current = true;
    setPhase("stopping");
    setLocalError("");

    const final = (await stopListening()).trim();
    manualStopRef.current = false;
    if (!mountedRef.current) return;

    const text = final || transcriptRef.current.trim();
    setDisplay(text);

    if (!text) {
      setPhase("idle");
      setLocalError("No speech detected. Press the microphone and try again.");
      return;
    }

    setRecorded(text);
    await submit(text);
  }

  async function submit(text: string) {
    setPhase("sending");
    setLocalError("");

    try {
      await onAnswer(text);
      if (!mountedRef.current) return;
      setPhase("idle");
      setRecorded("");
      setDisplay("");
    } catch (err) {
      if (!mountedRef.current) return;
      setRecorded(text);
      setDisplay(text);
      setPhase("ready");
      setLocalError(
        err instanceof Error
          ? err.message
          : "Could not analyze your answer. Tap the microphone to retry."
      );
    }
  }

  function handleMicPress() {
    if (disabled || phase === "stopping" || phase === "sending") return;

    if (phase === "recording") {
      void finishRecording();
      return;
    }
    if (phase === "ready") {
      void submit(recorded);
      return;
    }
    startRecording();
  }

  if (!recognitionSupported) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Voice interviews need Chrome or Edge with microphone access. Speech
        recognition is not available in this browser.
      </div>
    );
  }

  const busy = phase === "stopping" || phase === "sending";
  const label =
    phase === "recording"
      ? "Listening… tap to stop"
      : phase === "stopping"
        ? "Stopping recording…"
        : phase === "ready"
          ? "Tap to send your answer"
          : phase === "sending"
            ? "Analyzing your answer…"
            : "Tap to answer";
  const helper =
    phase === "recording"
      ? "Speak naturally. At the end, tap the circle again to get scored."
      : phase === "stopping"
        ? "Finishing the transcription."
        : phase === "ready"
          ? "Recording has ended. Send it for analysis, or tap again to retry."
          : phase === "sending"
            ? "The AI is reviewing relevance, structure, depth, and delivery."
            : isSpeaking
              ? "The interviewer is reading the question aloud."
              : "Speak naturally. Your words appear below as you talk.";

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleMicPress}
        disabled={disabled || busy}
        aria-label={
          phase === "recording"
            ? "Stop recording and analyze answer"
            : phase === "ready"
              ? "Send answer for analysis"
              : "Start recording answer"
        }
        className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 ${
          phase === "recording"
            ? "bg-red-600 hover:bg-red-700"
            : phase === "ready"
              ? "bg-amber-500 hover:bg-amber-600"
              : busy
                ? "bg-slate-400"
                : "bg-brand-600 hover:bg-brand-700"
        }`}
      >
        {phase === "recording" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-30" />
        )}
        <span className="relative">
          {busy ? (
            <svg
              className="h-10 w-10 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : phase === "recording" ? (
            <svg
              className="h-10 w-10"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          ) : phase === "ready" ? (
            <svg
              className="h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          ) : (
            <svg
              className="h-11 w-11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <path d="M12 17v5" />
              <path d="M8 22h8" />
            </svg>
          )}
        </span>
      </button>

      <p className="mt-4 text-sm font-semibold text-slate-800">{label}</p>
      <p className="mt-1 max-w-xs text-center text-xs text-slate-500">{helper}</p>

      <div className="mt-6 w-full rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Live transcript
          </span>
          {phase === "recording" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-red-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
              Recording
            </span>
          )}
        </div>
        <p
          className={`mt-2 min-h-[3.5rem] text-sm leading-relaxed ${
            display ? "text-slate-800" : "italic text-slate-400"
          }`}
        >
          {display || "Your spoken answer will appear here as you talk."}
          {phase === "recording" && display && (
            <span className="ml-0.5 inline-block animate-pulse text-brand-600">|</span>
          )}
        </p>
      </div>

      {localError && (
        <div className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {localError}
        </div>
      )}
      {speechError && speechError !== localError && (
        <div className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {speechError}
        </div>
      )}
    </div>
  );
}
