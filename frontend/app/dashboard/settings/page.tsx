"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  LogOut,
  RotateCcw,
  Save,
  Settings2,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import ProviderSettings from "@/components/settings/ProviderSettings";
import {
  DEFAULT_PREFERENCES,
  Preferences,
  clearPreferences,
  getPreferences,
  savePreferences,
} from "@/lib/preferences";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPreferences(getPreferences());
  }, []);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function save() {
    savePreferences(preferences);
    setMessage("Preferences saved. New mock interviews will use these defaults.");
  }

  function reset() {
    clearPreferences();
    setPreferences(DEFAULT_PREFERENCES);
    setMessage("Preferences reset to defaults.");
  }

  return (
    <div className="space-y-6">
      <div className="ic-page-head">
        <h1>Settings</h1>
        <p>Configure providers, models, tools, and integrations</p>
      </div>

      <ProviderSettings />

      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card space-y-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Settings2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink-900">Mock interview defaults</h2>
              <p className="text-xs text-slate-500">Used when you open the new interview setup.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="settings-type">Default interview type</label>
              <select
                id="settings-type"
                className="input"
                value={preferences.defaultType}
                onChange={(event) => update("defaultType", event.target.value as Preferences["defaultType"])}
              >
                <option value="behavioral">Behavioural</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="settings-difficulty">Default difficulty</label>
              <select
                id="settings-difficulty"
                className="input"
                value={preferences.defaultDifficulty}
                onChange={(event) =>
                  update("defaultDifficulty", event.target.value as Preferences["defaultDifficulty"])
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="settings-count">Default number of questions</label>
              <input
                id="settings-count"
                type="number"
                min={1}
                max={10}
                className="input"
                value={preferences.defaultQuestionCount}
                onChange={(event) =>
                  update(
                    "defaultQuestionCount",
                    Math.max(1, Math.min(10, Number(event.target.value) || 1))
                  )
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="settings-duration">Default session duration</label>
              <select
                id="settings-duration"
                className="input"
                value={preferences.defaultDuration}
                onChange={(event) => update("defaultDuration", Number(event.target.value))}
              >
                {[15, 30, 45, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>{minutes} minutes</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={preferences.autoSpeak}
              onChange={(event) => update("autoSpeak", event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            <span>
              <span className="block text-sm font-medium text-slate-700">Read questions aloud</span>
              <span className="block text-xs text-slate-500">
                Automatically start the interviewer voice when a new question appears.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} className="btn-primary">
              <Save className="h-4 w-4" />
              Save preferences
            </button>
            <button type="button" onClick={reset} className="btn-secondary">
              <RotateCcw className="h-4 w-4" />
              Reset defaults
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <User className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Account</h2>
                <p className="text-xs text-slate-500">Your signed-in identity.</p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="font-medium text-slate-800">{user?.full_name}</div>
              <div className="text-slate-500">{user?.email}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/dashboard/profile" className="btn-secondary btn-sm">
                <User className="h-3.5 w-3.5" />
                Open profile
              </Link>
              <button type="button" onClick={logout} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-ink-900">Privacy</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Interview answers, scores, and resume text are stored in your workspace.
              API keys stay on the backend and are never exposed to the browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


