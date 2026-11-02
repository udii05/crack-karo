"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { PreparationGoal, api } from "@/lib/api";
import { formatDate, goalStatusLabel } from "@/lib/format";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import PreparationGoalDialog from "./PreparationGoalDialog";

export default function PreparationGoals({
  goals,
  onChanged,
}: {
  goals: PreparationGoal[];
  onChanged: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PreparationGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PreparationGoal | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(goal: PreparationGoal) {
    setEditing(goal);
    setDialogOpen(true);
  }

  async function remove() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.deleteGoal(deleteTarget.id);
      setMessage("Preparation goal removed.");
      setDeleteTarget(null);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="ic-card ic-goals">
      <div className="ic-panel-head">
        <div>
          <div className="ic-panel-title">Preparation goals</div>
          <div className="ic-panel-sub">Keep your next opportunity in sight</div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          aria-label="Add preparation goal"
          className="ic-icon-btn"
          style={{ width: 30, height: 30 }}
        >
          <Plus />
        </button>
      </div>

      {message && (
        <div className="ic-panel-sub" style={{ color: "#16856b" }}>{message}</div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No preparation goals"
          description="Add an upcoming interview so your practice stays focused."
          action={
            <button type="button" onClick={openCreate} className="ic-btn ic-btn-primary">
              <Plus />
              Add goal
            </button>
          }
        />
      ) : (
        <>
          {goals.map((goal) => (
            <div key={goal.id} className="ic-goal group">
              <div className="ic-goal-line">
                <span className="ic-goal-name">
                  {goal.company} - {goal.role}
                </span>
                <span className="ic-goal-date">
                  {goal.interview_date ? formatDate(goal.interview_date) : "Ongoing"}
                </span>
              </div>
              <div className="ic-goal-meta">
                {goal.round} round · {goalStatusLabel(goal.status)}
              </div>
              <div className="ic-goal-progress">
                <span style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => openEdit(goal)}
                  aria-label={`Edit ${goal.company} goal`}
                  className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-brand-600"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(goal)}
                  aria-label={`Delete ${goal.company} goal`}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          <Link href="/dashboard/jobs" className="ic-text-link">
            Manage goals →
          </Link>
        </>
      )}

      <PreparationGoalDialog
        open={dialogOpen}
        goal={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setMessage(editing ? "Goal updated." : "Goal added.");
          onChanged();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete preparation goal?"
        description={
          deleteTarget
            ? `${deleteTarget.company} - ${deleteTarget.role} will be removed from your preparation plan.`
            : ""
        }
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
    </article>
  );
}
