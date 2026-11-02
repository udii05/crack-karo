"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Clock3,
  Mic,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import { Interview, SkillsData, api } from "@/lib/api";
import { formatPracticeTime, scoreTone, titleCase } from "@/lib/format";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import SkillBreakdown from "@/components/dashboard/SkillBreakdown";
import ScoreRing from "@/components/ui/ScoreRing";
import ProgressBar from "@/components/ui/ProgressBar";
import { ChartSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AnalyticsPage() {
  const { data: dashboard, loading: dashboardLoading, error: dashboardError, refresh } = useDashboardData();
  const [skills, setSkills] = useState<SkillsData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [skillResult, interviewResult] = await Promise.all([
        api.skills(),
        api.listInterviews(),
      ]);
      setSkills(skillResult);
      setInterviews(interviewResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number; scored: number }>();
    for (const interview of interviews) {
      const current = map.get(interview.type) || { count: 0, total: 0, scored: 0 };
      current.count += 1;
      if (interview.overall_score !== null) {
        current.total += interview.overall_score;
        current.scored += 1;
      }
      map.set(interview.type, current);
    }
    return Array.from(map.entries()).map(([type, value]) => ({
      type,
      count: value.count,
      avg: value.scored ? Math.round((value.total / value.scored) * 10) / 10 : 0,
    }));
  }, [interviews]);

  const weekly = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 8 }).map((_, index) => {
      const end = now - (7 - index) * 7 * 24 * 60 * 60 * 1000;
      const start = end - 7 * 24 * 60 * 60 * 1000;
      const count = interviews.filter((interview) => {
        const stamp = new Date(interview.created_at).getTime();
        return stamp >= start && stamp < end;
      }).length;
      return { label: index === 7 ? "This week" : `W${index + 1}`, count };
    });
  }, [interviews]);

  const maxWeekly = Math.max(1, ...weekly.map((item) => item.count));
  const weakest = skills?.weakest;

  if ((loading && !skills) || (dashboardLoading && !dashboard)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <ChartSkeleton />
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if ((error || dashboardError) && !skills) {
    return (
      <div className="card flex flex-col items-start gap-3">
        <div className="text-sm font-semibold text-red-700">Could not load analytics</div>
        <p className="text-sm text-slate-500">{error || dashboardError}</p>
        <button type="button" onClick={() => { void load(); void refresh(); }} className="btn-secondary btn-sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="ic-page-head">
        <h1>Performance Analytics</h1>
        <p>A deeper view of your scores, skills, practice rhythm, and recurring weaknesses.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card flex items-center gap-4">
          <ScoreRing value={dashboard?.avg_score || 0} size={88} label="Avg score" />
          <div>
            <div className="text-sm font-medium text-slate-500">Average score</div>
            <div className="mt-1 text-xs text-slate-400">Across scored sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Target className="h-4 w-4" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{dashboard?.readiness ?? 0}</div>
          <div className="mt-1 text-xs text-slate-500">Readiness score</div>
        </div>
        <div className="card">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Clock3 className="h-4 w-4" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatPracticeTime(dashboard?.practice_minutes || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Total practice time</div>
        </div>
        <div className="card">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Mic className="h-4 w-4" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{interviews.length}</div>
          <div className="mt-1 text-xs text-slate-500">Total sessions</div>
        </div>
      </div>

      <PerformanceChart initialDays={90} />

      <div className="grid gap-6 xl:grid-cols-2">
        <SkillBreakdown dimensions={skills?.dimensions || []} />

        <div className="card">
          <h2 className="text-sm font-bold text-ink-900">Technical vs Behavioural</h2>
          <p className="mt-1 text-sm text-slate-500">Session volume and average score by interview type.</p>
          {typeBreakdown.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Complete an interview to compare formats.</p>
          ) : (
            <div className="mt-5 space-y-5">
              {typeBreakdown.map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-slate-700">{item.type}</span>
                    <span className="text-slate-500">
                      {item.count} {item.count === 1 ? "session" : "sessions"}
                      {item.avg ? ` - avg ${item.avg}` : ""}
                    </span>
                  </div>
                  <ProgressBar
                    value={item.avg || 0}
                    tone="brand"
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-bold text-ink-900">Interview Frequency</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Sessions completed over the last eight weeks.</p>
          <div className="mt-6 flex h-40 items-end gap-2">
            {weekly.map((week) => (
              <div key={week.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md ${week.count > 0 ? "bg-brand-500" : "bg-slate-100"}`}
                    style={{ height: `${Math.max(4, (week.count / maxWeekly) * 100)}%` }}
                    title={`${week.label}: ${week.count} sessions`}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{week.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-ink-900">Recurring Weaknesses</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Patterns the AI coach found across your scored answers.
          </p>
          {dashboard?.coach?.recurring_mistakes?.length ? (
            <ul className="mt-5 space-y-3">
              {dashboard.coach.recurring_mistakes.map((item) => (
                <li key={item} className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              No recurring weaknesses yet. Complete more interviews to reveal patterns.
            </p>
          )}
          {weakest && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Current focus
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800">{weakest}</div>
              <div className="mt-1 text-xs text-slate-500">{skills?.recommended_topics[0]}</div>
            </div>
          )}
        </div>
      </div>

      {skills?.dimensions?.some((dimension) => dimension.delta !== null) && (
        <div className="card">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-ink-900">Improvement Trends</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {skills.dimensions.map((dimension) => (
              <div key={dimension.key} className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">{titleCase(dimension.key)}</div>
                <div className="mt-1 flex items-end justify-between">
                  <span className="text-lg font-semibold text-slate-900">{dimension.score}</span>
                  <span className={`text-xs font-medium ${(dimension.delta || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {dimension.delta === null
                      ? "No baseline"
                      : `${dimension.delta > 0 ? "+" : ""}${dimension.delta} pts`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
