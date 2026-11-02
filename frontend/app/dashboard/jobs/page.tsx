"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { JobAnalysis, api } from "@/lib/api";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import ResumeUpload from "@/components/ResumeUpload";

export default function JobPreparationPage() {
  const { data: dashboard, refresh } = useDashboardData();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState("");
  const [round, setRound] = useState("Technical");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const userSkills = useMemo(
    () => new Set((dashboard?.skills || []).map((skill) => skill.name.toLowerCase())),
    [dashboard]
  );

  const missingSkills = useMemo(
    () =>
      (analysis?.skills || []).filter(
        (skill) => !userSkills.has(skill.toLowerCase())
      ),
    [analysis, userSkills]
  );

  const roadmap = useMemo(() => {
    if (!analysis) return [];
    const steps = [];
    if (missingSkills.length > 0) {
      steps.push(`Close the gaps: ${missingSkills.slice(0, 4).join(", ")}.`);
    } else {
      steps.push("Review the core skills in the job description and prepare examples.");
    }
    steps.push(`Practise ${Math.min(5, analysis.likely_questions.length)} role-specific questions.`);
    steps.push("Run a technical mock interview and review the dimension scores.");
    steps.push("Update this preparation goal after each practice session.");
    return steps;
  }, [analysis, missingSkills]);

  async function analyze() {
    if (!role.trim() || !description.trim()) {
      setError("Add a target role and job description first.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await api.analyzeJob(
        role.trim(),
        company.trim() || "Target company",
        description.trim()
      );
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse this job.");
    } finally {
      setLoading(false);
    }
  }

  async function createGoal() {
    if (!company.trim() || !role.trim()) {
      setError("Add a company and role before creating a goal.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.createGoal({
        company: company.trim(),
        role: role.trim(),
        interview_date: date || null,
        round,
        status: "preparing",
        progress: 10,
      });
      setMessage("Preparation goal created. It now appears on your dashboard.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create preparation goal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="ic-page-head">
        <h1>Job Preparation</h1>
        <p>Turn a target role into a focused practice plan using your resume and the job description.</p>
      </div>

      {(error || message) && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {error || message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Briefcase className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink-900">Target opportunity</h2>
              <p className="text-xs text-slate-500">Paste the role details and analyse the gaps.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="job-company">Company</label>
              <input
                id="job-company"
                className="input"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label className="label" htmlFor="job-role">Target role</label>
              <input
                id="job-role"
                className="input"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. AI Engineer"
              />
            </div>
            <div>
              <label className="label" htmlFor="job-date">Interview date</label>
              <input
                id="job-date"
                type="date"
                className="input"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="job-round">Interview round</label>
              <input
                id="job-round"
                className="input"
                value={round}
                onChange={(event) => setRound(event.target.value)}
                placeholder="Technical"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="job-description">Job description</label>
            <textarea
              id="job-description"
              className="input min-h-[180px] resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Paste the job description here. Include responsibilities and required skills."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void analyze()} disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Analysing..." : "Analyse job"}
            </button>
            {analysis && (
              <button type="button" onClick={() => void createGoal()} disabled={saving} className="btn-secondary">
                {saving ? "Saving..." : "Create preparation goal"}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <ResumeUpload onUploaded={() => void refresh()} />
          <div className="card">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-bold text-ink-900">Your current skills</h2>
            </div>
            {dashboard?.skills?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {dashboard.skills.slice(0, 18).map((skill) => (
                  <span key={skill.name} className="rounded-md bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Upload a resume or complete an interview to build your skill profile.
              </p>
            )}
          </div>
        </div>
      </div>

      {analysis && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-bold text-ink-900">Role requirements</h2>
            </div>
            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Skills in the job description
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.skills.map((skill) => (
                  <span
                    key={skill}
                    className={`rounded-md px-2 py-1 text-xs capitalize ${
                      missingSkills.includes(skill)
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            {missingSkills.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs font-semibold text-amber-800">Missing from your profile</div>
                <p className="mt-1 text-sm leading-relaxed text-amber-900">
                  {missingSkills.join(", ")}
                </p>
              </div>
            )}
            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Likely questions
              </div>
              <ul className="mt-2 space-y-2">
                {analysis.likely_questions.map((question) => (
                  <li key={question} className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-ink-900">Preparation roadmap</h2>
            </div>
            <ol className="mt-4 space-y-3">
              {roadmap.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-600">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => void createGoal()} disabled={saving} className="btn-primary btn-sm">
                Add to preparation plan
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <a
                href={`/dashboard/interview/new?type=technical&difficulty=intermediate&role=${encodeURIComponent(role)}`}
                className="btn-secondary btn-sm"
              >
                Start targeted mock
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
