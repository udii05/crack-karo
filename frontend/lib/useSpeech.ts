"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cross-browser speech types. The Web Speech API's SpeechRecognition is not
 * yet part of the standard TypeScript DOM lib, so we declare the minimal
 * surface we use here.
 */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    length: number;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseSpeechResult {
  /** True when this browser supports the Web Speech API for speech recognition. */
  recognitionSupported: boolean;
  /** True when the browser can synthesize speech. */
  synthesisSupported: boolean;
  /** True while the AI interviewer is "speaking" the question. */
  isSpeaking: boolean;
  /** True while the mic is capturing the user's answer. */
  isListening: boolean;
  /** The live transcript of the current voice answer. */
  transcript: string;
  /** True if the browser denied microphone permission or an error occurred. */
  error: string | null;
  /** Speak a piece of text out loud (the AI interviewer's voice). */
  speak: (text: string) => void;
  /** Stop speaking immediately. */
  stopSpeaking: () => void;
  /** Start transcribing the user's voice answer. */
  startListening: () => void;
  /**
   * Stop transcribing. Resolves with the final transcript once the
   * recognition engine has flushed its final results (handles the async
   * "final result" timing Chrome uses).
   */
  stopListening: () => Promise<string>;
  /** Clear the current transcript. */
  resetTranscript: () => void;
  /** Available speech-synthesis voices for the user to pick from. */
  voices: SpeechSynthesisVoice[];
  /** Index of the currently selected TTS voice (-1 for default). */
  voiceIndex: number;
  setVoiceIndex: (i: number) => void;
}

export function useSpeech(): UseSpeechResult {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const stoppedByUserRef = useRef(false);
  const pendingResolveRef = useRef<((value: string) => void) | null>(null);
  const voiceIndexRef = useRef(-1);

  const [recognitionSupported] = useState<boolean>(() => !!getRecognitionCtor());
  const [synthesisSupported] = useState<boolean>(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIndex, setVoiceIndexState] = useState(-1);

  const flushTranscript = useCallback((): string => {
    const final = (finalTranscriptRef.current + interimTranscriptRef.current).trim();
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
    return final;
  }, []);

  const settlePending = useCallback(() => {
    if (pendingResolveRef.current) {
      pendingResolveRef.current(flushTranscript());
      pendingResolveRef.current = null;
    }
  }, [flushTranscript]);

  // Build a lazily-initialized recognition instance.
  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = getRecognitionCtor();
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscriptRef.current += res[0].transcript + " ";
        } else {
          interim += res[0].transcript;
        }
      }
      interimTranscriptRef.current = interim;
      setTranscript((finalTranscriptRef.current + interim).trim());
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setError(
          "Microphone access denied. Allow microphone access in your browser and try again."
        );
      } else if (ev.error === "no-speech") {
        setError("No speech detected. Please speak into the microphone.");
      } else if (ev.error !== "aborted") {
        setError(`Speech recognition error: ${ev.error}`);
      }
    };
    rec.onend = () => {
      setIsListening(false);
      // Chrome flushes final results here; if a manual stop is waiting,
      // resolve it now with the completed transcript.
      settlePending();
      if (!stoppedByUserRef.current) {
        // Recognition ended on its own (silence / timeout). Keep the final
        // transcript visible so the UI can push it to the answer box.
        const final = flushTranscript();
        if (final) setTranscript(final);
      } else {
        // Manual stop already delivered the transcript via the promise.
        flushTranscript();
      }
    };
    recognitionRef.current = rec;
    return rec;
  }, [flushTranscript, settlePending]);

  // Load available TTS voices (they can arrive asynchronously).
  useEffect(() => {
    if (!synthesisSupported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, [synthesisSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!synthesisSupported || !text.trim()) return;
      const synth = window.speechSynthesis;
      // Chrome can get stuck if we speak while an old utterance is still
      // queued. Always cancel first for a clean start.
      try {
        synth.cancel();
      } catch {
        /* noop */
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      if (voiceIndexRef.current >= 0 && voices[voiceIndexRef.current]) {
        utter.voice = voices[voiceIndexRef.current];
      } else {
        // Prefer a female natural voice if available (common for "interviewer").
        const preferred = voices.find(
          (v) => v.default && /en[-_]US/i.test(v.lang)
        );
        if (preferred) utter.voice = preferred;
      }
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      synth.speak(utter);
    },
    [synthesisSupported, voices]
  );

  const stopSpeaking = useCallback(() => {
    if (synthesisSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
    setIsSpeaking(false);
  }, [synthesisSupported]);

  const startListening = useCallback(() => {
    const rec = ensureRecognition();
    if (!rec) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }
    setError(null);
    // Don't let the interviewer's TTS play into the mic.
    if (synthesisSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
    setIsSpeaking(false);
    stoppedByUserRef.current = false;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      // Already started — treat as no-op.
    }
  }, [ensureRecognition, synthesisSupported]);

  const stopListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const rec = recognitionRef.current;
      stoppedByUserRef.current = true;
      if (!rec) {
        resolve(flushTranscript());
        return;
      }
      // Fallback safety: if the engine never fires onend, resolve anyway.
      const timeout = window.setTimeout(() => {
        if (pendingResolveRef.current) {
          pendingResolveRef.current(flushTranscript());
          pendingResolveRef.current = null;
        }
      }, 2000);
      pendingResolveRef.current = (value: string) => {
        window.clearTimeout(timeout);
        resolve(value);
      };
      try {
        rec.stop();
      } catch {
        settlePending();
      }
      setIsListening(false);
    });
  }, [flushTranscript, settlePending]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
  }, []);

  const setVoiceIndex = useCallback(
    (i: number) => {
      voiceIndexRef.current = i;
      setVoiceIndexState(i);
    },
    []
  );

  // Safety watchdog: Chrome sometimes leaves speechSynthesis in a "speaking"
  // state where onend never fires. Force it clear after a generous timeout.
  useEffect(() => {
    if (!isSpeaking) return;
    const t = window.setTimeout(() => {
      if (synthesisSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* noop */
        }
      }
      setIsSpeaking(false);
    }, 30000);
    return () => window.clearTimeout(t);
  }, [isSpeaking, synthesisSupported]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
      if (synthesisSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* noop */
        }
      }
    };
  }, [synthesisSupported]);

  return {
    recognitionSupported,
    synthesisSupported,
    isSpeaking,
    isListening,
    transcript,
    error,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    resetTranscript,
    voices,
    voiceIndex,
    setVoiceIndex,
  };
}
