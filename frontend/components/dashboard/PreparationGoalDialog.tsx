"use client";

import { useEffect, useState } from "react";
import { api, PreparationGoal } from "@/lib/api";
import Modal from "@/components/ui/Modal";

const MILESTONES = [
  { label: "Resume tailored", value: 33 },
  { label: "Practice questions", value: 66 },
  { label: "Mock interview complete", value: 100 },
];

export default function PreparationGoalDialog({
  open,
  goal,
  onClose,
  onSaved,
}: {
  open: boolean;
  goal: PreparationGoal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [round, setRound] = useState("Technical");
  const [status, setStatus] = useState("preparing");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCompany(goal?.company || "");
    setRole(goal?.role || "");
    setInterviewDate(goal?.interview_date || "");
    setRound(goal?.round || "Technical");
    setStatus(goal?.status || "preparing");
    setProgress(goal?.progress || 0);
    setError("");
  }, [open, goal]);

  function toggleMilestone(value: number) {
    setProgress((current) => (current >= value ? Math.max(0, value - 34) : value));
  }

  async function save() {
    if (!company.trim() || !role.trim()) {
      setError("Company and role are required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      company: company.trim(),
      role: role.trim(),
      interview_date: interviewDate || null,
      round: round.trim() || "Technical",
      status,
      progress,
    };
    try {
      if (goal) {
        await api.updateGoal(goal.id, payload);
      } else {
        await api.createGoal(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this goal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? "Edit preparation goal" : "Add preparation goal"}
      description="Track a target role, interview date, and preparation progress."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : goal ? "Save changes" : "Add goal"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="goal-company">Company</label>
            <input
              id="goal-company"
              className="input"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Google"
            />
          </div>
          <div>
            <label className="label" htmlFor="goal-role">Target role</label>
            <input
              id="goal-role"
              className="input"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="AI Engineer"
            />
          </div>
          <div>
            <label className="label" htmlFor="goal-date">Interview date</label>
            <input
              id="goal-date"
              type="date"
              className="input"
              value={interviewDate}
              onChange={(event) => setInterviewDate(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="goal-round">Interview round</label>
            <input
              id="goal-round"
              className="input"
              value={round}
              onChange={(event) => setRound(event.target.value)}
              placeholder="Technical"
            />
          </div>
          <div>
            <label className="label" htmlFor="goal-status">Status</label>
            <select
              id="goal-status"
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="planning">Planning</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="goal-progress">
              Progress: {progress}%
            </label>
            <input
              id="goal-progress"
              type="range"
              min={0}
              max={100}
              step={1}
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              className="mt-2 w-full accent-brand-600"
            />
          </div>
        </div>

        <div>
          <div className="label">Milestones</div>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {MILESTONES.map((milestone) => (
              <label key={milestone.label} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={progress >= milestone.value}
                  onChange={() => toggleMilestone(milestone.value)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                {milestone.label}
                <span className="ml-auto text-xs text-slate-400">{milestone.value}%</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
