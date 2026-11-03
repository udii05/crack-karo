"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Mic,
  Pencil,
  Target,
  User as UserIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPracticeTime, initials } from "@/lib/format";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import ResumeUpload from "@/components/ResumeUpload";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { data, loading, refresh } = useDashboardData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveName() {
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateProfile(name.trim());
      updateUser(updated);
      setEditing(false);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="ic-page-head">
        <h1>Profile</h1>
        <p>Your account, resume, and current interview profile.</p>
      </div>

      {(message || error) && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? <Target className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {error || message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf0fb] text-lg font-bold text-[#315c9d]">
              {initials(user?.full_name || "Crack Karo")}
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    className="input h-9"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-label="Full name"
                  />
                  <button type="button" onClick={() => void saveName()} disabled={saving} className="btn-primary btn-sm">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-slate-900">{user?.full_name}</h2>
                  <button
                    type="button"
                    onClick={() => { setName(user?.full_name || ""); setEditing(true); setMessage(""); }}
                    aria-label="Edit name"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Member since {formatDate(user?.created_at)}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Mic className="h-3 w-3" />
                Interviews
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900">{data?.total_interviews ?? 0}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Target className="h-3 w-3" />
                Avg score
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900">{data?.avg_score ?? 0}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Clock3 className="h-3 w-3" />
                Practice
              </div>
              <div className="mt-1 text-sm font-bold text-ink-900">
                {formatPracticeTime(data?.practice_minutes ?? 0)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <UserIcon className="h-3 w-3" />
                Role
              </div>
              <div className="mt-1 text-sm font-semibold capitalize text-slate-900">{user?.role || "Job seeker"}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ResumeUpload onUploaded={() => void refresh()} />

          <div className="card">
            <h2 className="text-sm font-bold text-ink-900">Detected skills</h2>
            {loading && !data ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : data?.skills?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.skills.map((skill) => (
                  <span key={skill.name} className="rounded-md bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Upload a resume above to detect your skills and improve question targeting.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
