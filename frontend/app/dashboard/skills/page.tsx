"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  RoleAssessment,
  RoleOption,
  SkillRecommendations,
  SkillsData,
  UserSkill,
  api,
} from "@/lib/api";
import ResumeUpload from "@/components/ResumeUpload";
import SkillBreakdown from "@/components/dashboard/SkillBreakdown";
import EmptyState from "@/components/ui/EmptyState";
import ProficiencySlider, {
  proficiencyLabel,
} from "@/components/ui/ProficiencySlider";
import ProgressBar from "@/components/ui/ProgressBar";
import ScoreRing from "@/components/ui/ScoreRing";
import { Skeleton } from "@/components/ui/Skeleton";

const ROLE_KEY = "copilot_target_role";
const RECOMMENDATION_INTRO =
  "These are the skills that need more attention. Focus on strengthening these areas to improve your interview readiness.";

function focusCategory(skill: string): string {
  const value = skill.toLowerCase();
  if (
    value.includes("data structure") ||
    value.includes("algorithm") ||
    value.includes("programming")
  ) {
    return "Foundations";
  }
  if (
    value.includes("machine") ||
    value.includes("deep") ||
    value.includes("generative") ||
    value.includes("agentic") ||
    value.includes("ai")
  ) {
    return "AI Engineering";
  }
  if (
    value.includes("database") ||
    value.includes("sql") ||
    value.includes("data ")
  ) {
    return "Data Systems";
  }
  if (
    value.includes("system") ||
    value.includes("cloud") ||
    value.includes("network") ||
    value.includes("devops")
  ) {
    return "Systems";
  }
  return "Focus Area";
}

export default function SkillsPage() {
  const [interviewSkills, setInterviewSkills] = useState<SkillsData | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState("Software Engineer");
  const [assessment, setAssessment] = useState<RoleAssessment | null>(null);
  const [recommendations, setRecommendations] = useState<SkillRecommendations | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRoleData(role: string, hasSkills = userSkills.length > 0) {
    setAssessing(true);
    setRecommendationsLoading(hasSkills);
    setRecommendationsError("");

    const assessmentPromise = api.assessRole(role);
    const recommendationPromise = hasSkills
      ? api.skillRecommendations(role)
      : Promise.resolve(null);

    const [assessmentResult, recommendationResult] = await Promise.allSettled([
      assessmentPromise,
      recommendationPromise,
    ]);

    if (assessmentResult.status === "fulfilled") {
      setAssessment(assessmentResult.value);
    } else {
      setError(
        assessmentResult.reason instanceof Error
          ? assessmentResult.reason.message
          : "Could not analyse this role."
      );
    }

    if (recommendationResult.status === "fulfilled") {
      setRecommendations(recommendationResult.value);
    } else {
      setRecommendations(null);
      setRecommendationsError(
        recommendationResult.reason instanceof Error
          ? recommendationResult.reason.message
          : "Could not generate recommendations."
      );
    }

    setRecommendationsLoading(false);
    setAssessing(false);
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [interviewResult, skillResult, roleResult] = await Promise.all([
        api.skills(),
        api.userSkills(),
        api.roleCatalog(),
      ]);
      setInterviewSkills(interviewResult);
      setUserSkills(skillResult);
      setRoles(roleResult);
      setRatings(
        Object.fromEntries(skillResult.map((skill) => [skill.id, skill.proficiency]))
      );
      setRatedIds(
        new Set(skillResult.filter((skill) => skill.self_rated).map((skill) => skill.id))
      );
      setCurrentSkillIndex(0);

      const saved = window.localStorage.getItem(ROLE_KEY);
      const role =
        roleResult.find((item) => item.name === saved)?.name ||
        roleResult.find((item) => item.name === "Software Engineer")?.name ||
        roleResult[0]?.name ||
        "Software Engineer";
      setSelectedRole(role);
      await loadRoleData(role, skillResult.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your skill assessment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentSkillIndex((index) =>
      Math.min(index, Math.max(0, userSkills.length - 1))
    );
  }, [userSkills.length]);

  const selectedRoleMeta = useMemo(
    () => roles.find((role) => role.name === selectedRole),
    [roles, selectedRole]
  );

  const currentSkill = userSkills[currentSkillIndex] ?? null;
  const currentValue = currentSkill
    ? ratings[currentSkill.id] ?? currentSkill.proficiency
    : 1;
  const currentRated = currentSkill
    ? ratedIds.has(currentSkill.id) || currentSkill.self_rated
    : false;
  const ratedCount = ratedIds.size;

  function changeSkillRating(skillId: string, value: number) {
    setRatings((current) => ({ ...current, [skillId]: value }));
    setRatedIds((current) => {
      const next = new Set(current);
      next.add(skillId);
      return next;
    });
  }

  async function refreshSkills() {
    const result = await api.userSkills();
    setUserSkills(result);
    setRatings(
      Object.fromEntries(result.map((skill) => [skill.id, skill.proficiency]))
    );
    setRatedIds(
      new Set(result.filter((skill) => skill.self_rated).map((skill) => skill.id))
    );
    setCurrentSkillIndex(0);
    await loadRoleData(selectedRole, result.length > 0);
  }

  async function saveRatings() {
    if (userSkills.length === 0) return;
    const ratedSkills = userSkills.filter((skill) => ratedIds.has(skill.id));
    if (ratedSkills.length === 0) {
      setMessage("Rate at least one skill before saving.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await api.saveSkillRatings(
        ratedSkills.map((skill) => ({
          skill_id: skill.id,
          proficiency: ratings[skill.id] ?? skill.proficiency,
        }))
      );
      setUserSkills(updated);
      setRatings(
        Object.fromEntries(updated.map((skill) => [skill.id, skill.proficiency]))
      );
      setRatedIds(
        new Set(updated.filter((skill) => skill.self_rated).map((skill) => skill.id))
      );
      setMessage("Self-ratings saved.");
      await loadRoleData(selectedRole, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save ratings.");
    } finally {
      setSaving(false);
    }
  }

  async function addSkill() {
    const name = newSkill.trim();
    if (!name) return;
    setAdding(true);
    setError("");
    setMessage("");
    try {
      await api.addSkill(name, 2);
      setNewSkill("");
      setMessage(`Added ${name}. Rate it below.`);
      await refreshSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this skill.");
    } finally {
      setAdding(false);
    }
  }

  async function changeRole(role: string) {
    setSelectedRole(role);
    window.localStorage.setItem(ROLE_KEY, role);
    setMessage("");
    await loadRoleData(role, userSkills.length > 0);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-5 xl:grid-cols-2">
          <Skeleton className="h-72 rounded-[18px]" />
          <Skeleton className="h-72 rounded-[18px]" />
        </div>
        <Skeleton className="h-80 rounded-[18px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="ic-page-head">
        <h1>Skill Assessment</h1>
        <p>
          Upload a resume, rate your skills honestly, and see how your profile fits a generic role.
        </p>
      </div>

      {(error || message) && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {error || message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink-900">Target role</h2>
              <p className="text-xs text-slate-500">
                Pick a role, then upload a resume to extract your skills.
              </p>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="target-role">Role</label>
            <select
              id="target-role"
              className="input"
              value={selectedRole}
              onChange={(event) => void changeRole(event.target.value)}
            >
              {roles.map((role) => (
                <option key={role.name} value={role.name}>{role.name}</option>
              ))}
            </select>
            {selectedRoleMeta && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {selectedRoleMeta.description}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-[#fbfcfe] p-4">
            <ResumeUpload compact onUploaded={() => void refreshSkills()} />
          </div>

        </div>

        <div className="card flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Role fit</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Weighted match against the requirements for {selectedRole}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadRoleData(selectedRole)}
              disabled={assessing}
              className="btn-secondary btn-sm"
            >
              {assessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Refresh
            </button>
          </div>

          {assessment && userSkills.length > 0 ? (
            <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:items-center">
              <ScoreRing value={assessment.score} size={136} label="Role fit" />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="text-lg font-bold text-ink-900">{assessment.readiness}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {assessment.matched_count} of {assessment.required_count} role requirements covered
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Coverage</span>
                    <span className="font-semibold text-slate-700">{assessment.coverage}%</span>
                  </div>
                  <ProgressBar value={assessment.coverage} className="mt-1.5" />
                </div>
                <div className="mt-3 text-xs leading-relaxed text-slate-500">
                  {assessment.missing_skills.length > 0
                    ? `${assessment.missing_skills.length} requirement${assessment.missing_skills.length === 1 ? "" : "s"} still missing.`
                    : "All role requirements are represented in your skill profile."}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-1 items-center justify-center">
              <EmptyState
                icon={Target}
                title="No role assessment yet"
                description="Upload a resume or add a skill, then rate yourself to calculate your fit."
              />
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink-900">Rate your skills</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Review one skill at a time and save when you are done.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void saveRatings()}
            disabled={saving || userSkills.length === 0 || ratedIds.size === 0}
            className="btn-primary btn-sm"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save ratings
          </button>
        </div>

        {userSkills.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={SlidersHorizontal}
              title="No skills yet"
              description="Upload a resume above, or add a skill manually, then rate it."
            />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 sm:flex-row sm:items-start">
              <Sparkles className="h-5 w-5 shrink-0 text-brand-600" />
              <p className="flex-1 text-xs leading-relaxed text-brand-800">
                Take your time to evaluate your skills honestly. A clear understanding of
                your strengths and areas for improvement will help you prepare with greater
                focus and confidence.
              </p>
              <span className="badge shrink-0 self-start bg-white/80 text-brand-700">
                {ratedCount}/{userSkills.length} rated
              </span>
            </div>

            {currentSkill && (
              <div className="mt-4 flex items-stretch gap-2 sm:gap-3">
                <button
                  type="button"
                  aria-label="Previous skill"
                  onClick={() =>
                    setCurrentSkillIndex((index) => Math.max(0, index - 1))
                  }
                  disabled={currentSkillIndex === 0}
                  className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-400 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-35 sm:w-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1 rounded-xl border border-line bg-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Skill {currentSkillIndex + 1} of {userSkills.length}
                      </div>
                      <div className="mt-1 truncate text-lg font-bold capitalize text-ink-900">
                        {currentSkill.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {currentRated ? "Self-rated" : "Extracted from resume"}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-brand-700">
                        {proficiencyLabel(currentValue)}
                      </span>
                      <span
                        className={`badge ${
                          currentRated
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {currentRated ? "Rated" : "Not rated"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProficiencySlider
                      value={currentValue}
                      onChange={(next) => changeSkillRating(currentSkill.id, next)}
                      label={`Rate ${currentSkill.name}`}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Navigate with the arrows or keyboard.</span>
                    <span>
                      {currentSkillIndex + 1} / {userSkills.length}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Next skill"
                  onClick={() =>
                    setCurrentSkillIndex((index) =>
                      Math.min(userSkills.length - 1, index + 1)
                    )
                  }
                  disabled={currentSkillIndex >= userSkills.length - 1}
                  className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-400 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-35 sm:w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
          <input
            className="input"
            value={newSkill}
            onChange={(event) => setNewSkill(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void addSkill();
              }
            }}
            placeholder="Add a skill, e.g. Data Structures"
            aria-label="Add a skill"
          />
          <button
            type="button"
            onClick={() => void addSkill()}
            disabled={adding || !newSkill.trim()}
            className="btn-secondary shrink-0"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add skill
          </button>
        </div>
      </div>

      {userSkills.length > 0 && (
        <section className="rec-panel">
          <div className="rec-topline" />
          <div className="rec-content">
            <div className="rec-title-row">
              <div>
                <div className="rec-eyebrow">
                  <TrendingUp />
                  Your preparation roadmap
                </div>
                <h2 className="rec-title">A few areas to level up</h2>
                <p className="rec-subtitle">
                  {recommendations?.summary || RECOMMENDATION_INTRO}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadRoleData(selectedRole)}
                disabled={recommendationsLoading}
                className="rec-refresh"
              >
                {recommendationsLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw />
                )}
                Regenerate
              </button>
            </div>

            <div className="rec-snapshot">
              <span className="rec-dot" />
              <p>
                <strong>
                  {recommendations
                    ? `${Math.min(recommendations.focus_areas.length, 3)} focus areas identified`
                    : "Identifying focus areas"}
                </strong>{" "}
                · Based on your {selectedRole} role and skill assessment
              </p>
            </div>

            {recommendationsLoading ? (
              <div className="rec-cards">
                <Skeleton className="h-[275px] rounded-[14px]" />
                <Skeleton className="h-[275px] rounded-[14px]" />
                <Skeleton className="h-[275px] rounded-[14px]" />
              </div>
            ) : recommendationsError ? (
              <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                <span>{recommendationsError}</span>
                <button
                  type="button"
                  onClick={() => void loadRoleData(selectedRole)}
                  className="btn-secondary btn-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            ) : recommendations && recommendations.focus_areas.length > 0 ? (
              <div className="rec-cards">
                {recommendations.focus_areas.slice(0, 3).map((area, index) => {
                  const priority =
                    index === 0
                      ? { label: "High priority", className: "" }
                      : index === 1
                        ? { label: "Build next", className: "medium" }
                        : { label: "Growth area", className: "growth" };
                  return (
                    <article className="rec-card" key={area.skill}>
                      <div className="rec-cardtop">
                        <span className="rec-number">
                          {String(index + 1).padStart(2, "0")} / {focusCategory(area.skill)}
                        </span>
                        <span className={`rec-priority ${priority.className}`}>
                          {priority.label}
                        </span>
                      </div>
                      <h2>{area.skill}</h2>
                      <p className="rec-desc">{area.why}</p>
                      <div className="rec-skill-label">Topics to revisit</div>
                      <div className="rec-tags">
                        {area.topics.map((topic) => (
                          <span key={topic} className="rec-tag">{topic}</span>
                        ))}
                      </div>
                      <div className="rec-task">
                        <div className="rec-taskline">
                          <b>Try this:</b> {area.action}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No recommendations yet"
                description="Rate a few skills, then regenerate to build your roadmap."
              />
            )}

            <div className="rec-bottom">
              <span className="rec-note">
                Small, consistent practice will make these gaps easier to close.
              </span>
            </div>
          </div>
        </section>
      )}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0edff] text-[#7962cf]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink-900">Interview answer skills</h2>
            <p className="text-xs text-slate-500">
              Separate from resume skills: these come from your scored mock interviews.
            </p>
          </div>
        </div>
        <SkillBreakdown dimensions={interviewSkills?.dimensions || []} showLink={false} />
      </div>
    </div>
  );
}

