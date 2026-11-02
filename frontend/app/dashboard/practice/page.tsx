"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Layers,
  Mic,
  RotateCcw,
  Search,
  Target,
  X,
} from "lucide-react";
import {
  Question,
  QuestionAnswerResult,
  QuestionDomain,
  api,
} from "@/lib/api";
import { getDomainMeta } from "@/lib/domains";
import { scoreTone } from "@/lib/format";
import VoiceInterview from "@/components/VoiceInterview";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import ScoreRing from "@/components/ui/ScoreRing";
import { Skeleton } from "@/components/ui/Skeleton";

const DIMENSION_LABELS: Record<string, string> = {
  relevance: "Relevance",
  structure: "Structure",
  technical: "Technical",
  delivery: "Delivery",
};

function difficultyTone(difficulty: string): string {
  if (difficulty === "beginner") return "bg-emerald-50 text-emerald-700";
  if (difficulty === "advanced") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

export default function QuestionBankPage() {
  const [domains, setDomains] = useState<QuestionDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<QuestionAnswerResult | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadDomains(silent = false) {
    if (!silent) setLoadingDomains(true);
    try {
      const rows = await api.questionDomains();
      setDomains(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load practice domains.");
    } finally {
      if (!silent) setLoadingDomains(false);
    }
  }

  useEffect(() => {
    void loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedQuestion) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedQuestion(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedQuestion]);

  const totalQuestions = domains.reduce((sum, domain) => sum + domain.total, 0);
  const totalCompleted = domains.reduce((sum, domain) => sum + domain.completed, 0);
  const overallProgress = totalQuestions ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

  const currentDomain = selectedDomain
    ? domains.find((domain) => domain.name === selectedDomain)
    : null;
  const currentMeta = selectedDomain ? getDomainMeta(selectedDomain) : null;
  const CurrentIcon = currentMeta?.icon;
  const domainTotal = currentDomain?.total ?? questions.length;
  const domainCompleted =
    currentDomain?.completed ?? questions.filter((question) => question.completed).length;
  const domainProgress = domainTotal ? Math.round((domainCompleted / domainTotal) * 100) : 0;

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter((question) => question.body.toLowerCase().includes(term));
  }, [questions, search]);

  async function openDomain(domain: QuestionDomain) {
    setSelectedDomain(domain.name);
    setQuestions([]);
    setSearch("");
    setSelectedQuestion(null);
    setResult(null);
    setError("");
    setLoadingQuestions(true);
    try {
      setQuestions(await api.listQuestions({ category: domain.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this domain.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  function backToDomains() {
    setSelectedDomain(null);
    setQuestions([]);
    setSelectedQuestion(null);
    setResult(null);
    setSearch("");
    setError("");
  }

  function openQuestion(question: Question) {
    setSelectedQuestion(question);
    setResult(null);
  }

  async function handleAnswer(transcript: string) {
    if (!selectedQuestion) return;
    setSaving(true);
    try {
      const response = await api.answerQuestion(selectedQuestion.id, transcript);
      setResult(response);
      setQuestions((current) =>
        current.map((question) =>
          question.id === selectedQuestion.id
            ? {
                ...question,
                completed: true,
                best_score: response.best_score,
                attempt_count: question.attempt_count + 1,
              }
            : question
        )
      );
      setSelectedQuestion((current) =>
        current
          ? {
              ...current,
              completed: true,
              best_score: response.best_score,
              attempt_count: current.attempt_count + 1,
            }
          : current
      );
      await loadDomains(true);
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function nextQuestion() {
    if (!selectedQuestion) return;
    const index = questions.findIndex((question) => question.id === selectedQuestion.id);
    const next =
      questions.slice(index + 1).find((question) => !question.completed) ||
      questions.find((question) => !question.completed) ||
      questions[index + 1] ||
      null;
    if (!next) {
      setSelectedQuestion(null);
      setResult(null);
      return;
    }
    setSelectedQuestion(next);
    setResult(null);
  }

  if (loadingDomains) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[18px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error && domains.length === 0) {
    return (
      <div className="card flex flex-col items-start gap-3">
        <div className="text-sm font-semibold text-red-700">Could not load the question bank</div>
        <p className="text-sm text-slate-500">{error}</p>
        <button type="button" onClick={() => void loadDomains()} className="btn-secondary btn-sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!selectedDomain) {
    return (
      <div className="space-y-6">
        <div className="ic-page-head">
          <h1>Question Bank</h1>
          <p>
            Choose a domain, check your preparation, and answer each question with your voice.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-ink-900">Overall preparation</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {totalCompleted} of {totalQuestions} questions practised across {domains.length} domains
              </div>
            </div>
            <div className="text-2xl font-bold tracking-[-0.7px] text-ink-900">
              {overallProgress}%
            </div>
          </div>
          <ProgressBar value={overallProgress} className="mt-3" />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {domains.map((domain) => {
            const meta = getDomainMeta(domain.name);
            const Icon = meta.icon;
            const progress = domain.total
              ? Math.round((domain.completed / domain.total) * 100)
              : 0;
            return (
              <button
                key={domain.name}
                type="button"
                onClick={() => void openDomain(domain)}
                className="card group p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${meta.iconClass}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <ChevronRight className="mt-2 h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-600" />
                </div>
                <div className="mt-3 text-sm font-bold text-ink-900">{domain.name}</div>
                <p className="mt-1 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-slate-500">
                  {meta.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {domain.completed}/{domain.total} questions
                  </span>
                  <span className="font-semibold text-slate-600">{progress}%</span>
                </div>
                <ProgressBar value={progress} className="mt-1.5" />
                {domain.average_score !== null && (
                  <div className="mt-2 text-[10px] font-medium text-slate-400">
                    Average score: {domain.average_score}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={backToDomains}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        All domains
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {currentMeta && CurrentIcon && (
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${currentMeta.iconClass}`}>
              <CurrentIcon className="h-5 w-5" strokeWidth={1.8} />
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-[-0.5px] text-ink-900">
              {selectedDomain}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {currentMeta?.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-ink-900">
            {domainCompleted}/{domainTotal} questions
          </div>
          <div className="text-xs text-slate-400">{domainProgress}% complete</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-600">Preparation progress</div>
          <div className="text-xs font-bold text-brand-700">{domainProgress}%</div>
        </div>
        <ProgressBar value={domainProgress} className="mt-2" />
        {currentDomain?.average_score !== null && currentDomain?.average_score !== undefined && (
          <div className="mt-2 text-[11px] text-slate-400">
            Average best score: {currentDomain.average_score}
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search this domain..."
          aria-label="Search questions in this domain"
          className="input pl-9"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadingQuestions && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-[18px]" />
          ))}
        </div>
      )}

      {!loadingQuestions && filteredQuestions.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No questions match"
          description="Try a different search term in this domain."
        />
      )}

      {!loadingQuestions && filteredQuestions.length > 0 && (
        <div className="space-y-2.5">
          {filteredQuestions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => openQuestion(question)}
              className="card group flex w-full items-center gap-4 p-4 text-left transition-all hover:border-brand-300 hover:shadow-md"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  question.completed
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {question.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-relaxed text-slate-800">
                  {question.body}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`badge ${difficultyTone(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                  {question.completed && (
                    <span className="badge bg-emerald-50 text-emerald-700">
                      Practised
                    </span>
                  )}
                  {question.best_score !== null && (
                    <span className={`badge ${scoreTone(question.best_score)}`}>
                      Best {question.best_score}
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-600" />
            </button>
          ))}
        </div>
      )}

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close question"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setSelectedQuestion(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Practice question"
            className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-line bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-brand-50 text-brand-700">{selectedQuestion.category}</span>
                <span className={`badge ${difficultyTone(selectedQuestion.difficulty)}`}>
                  {selectedQuestion.difficulty}
                </span>
                {selectedQuestion.best_score !== null && (
                  <span className={`badge ${scoreTone(selectedQuestion.best_score)}`}>
                    Best {selectedQuestion.best_score}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-base font-semibold leading-relaxed text-ink-900">
                {selectedQuestion.body}
              </p>

              {!result ? (
                <div className="mt-5">
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
                    <Mic className="h-3.5 w-3.5" />
                    Tap the microphone, answer out loud, then tap again to stop and score.
                  </div>
                  <VoiceInterview
                    question={selectedQuestion.body}
                    autoSpeak={false}
                    disabled={saving}
                    onAnswer={handleAnswer}
                  />
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#fbfcfe] p-5 sm:flex-row sm:items-center">
                    <ScoreRing value={result.score} size={96} label="Score" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-ink-900">
                        Answer analysis
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {result.summary}
                      </p>
                      <div className="mt-2 text-xs text-slate-400">
                        Best score: {result.best_score} / 100
                      </div>
                    </div>
                  </div>

                  {Object.keys(result.dimensions).length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(result.dimensions).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-600">
                              {DIMENSION_LABELS[key] || key}
                            </span>
                            <span className="text-slate-500">{value}</span>
                          </div>
                          <ProgressBar value={Number(value)} className="mt-1.5" />
                        </div>
                      ))}
                    </div>
                  )}

                  {result.weaknesses.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                        <Target className="h-3.5 w-3.5" />
                        What to improve
                      </div>
                      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-800">
                        {result.weaknesses.map((weakness, index) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="btn-secondary btn-sm"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="btn-primary btn-sm"
                    >
                      Next question
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
