"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  Flame,
  Mic,
  PlayCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  firstName,
  formatPracticeTime,
  greetingForHour,
} from "@/lib/format";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import MetricCard from "@/components/dashboard/MetricCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import SkillBreakdown from "@/components/dashboard/SkillBreakdown";
import RecentInterviews from "@/components/dashboard/RecentInterviews";
import CoachCard from "@/components/dashboard/CoachCard";
import PreparationGoals from "@/components/dashboard/PreparationGoals";
import { ChartSkeleton, MetricSkeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useDashboardData();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <div className="h-[220px] animate-pulse rounded-[22px] bg-[#edf4ff]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
        <div className="grid gap-[18px] xl:grid-cols-[1.55fr_1fr]">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="ic-card p-5">
        <div className="text-sm font-semibold text-red-700">Could not load your dashboard</div>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button type="button" onClick={() => void refresh()} className="ic-btn ic-btn-secondary mt-3">
          <RotateCcw />
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const name = firstName(user?.full_name || "there");
  const hasData = data.total_interviews > 0;

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error} Showing the last loaded data.
        </div>
      )}

      <section className="ic-welcome">
        <div className="ic-welcome-copy">
          <div className="ic-eyebrow">
            <CalendarCheck />
            {greeting}, {name}
          </div>
          <h1>Ready to ace your next interview?</h1>
          <p>
            Your preparation journey, all in one place. Review your scores, close skill
            gaps, and walk into the room with a plan.
          </p>
          <div className="ic-actions">
            <Link href="/dashboard/interview/new" className="ic-btn ic-btn-primary">
              Start Mock Interview
              <ArrowRight />
            </Link>
            <Link href="/dashboard/analytics" className="ic-btn ic-btn-secondary">
              View Performance
            </Link>
          </div>

          {data.active_interview && (
            <Link
              href={`/dashboard/interview/new?resume=${data.active_interview.id}`}
              className="ic-continue"
            >
              <div className="ic-continue-icon">
                <PlayCircle />
              </div>
              <div>
                <div className="ic-continue-title">Continue practising</div>
                <div className="ic-continue-sub">
                  {data.active_interview.title} · Pick up where you left off
                </div>
              </div>
              <div className="ic-continue-arrow">→</div>
            </Link>
          )}
        </div>

        <div
          className="ic-readiness"
          style={{
            background: `conic-gradient(#3978e8 0 ${Math.max(0, Math.min(100, data.readiness))}%, #dce7f7 ${Math.max(0, Math.min(100, data.readiness))}% 100%)`,
          }}
          role="img"
          aria-label={`Readiness: ${data.readiness} out of 100`}
        >
          <div className="ic-readiness-inner">
            <strong>{data.readiness}</strong>
            <span>READINESS</span>
          </div>
        </div>
      </section>

      <section className="ic-metrics">
        <MetricCard
          label="Total Interviews"
          value={String(data.total_interviews)}
          sub="Completed mock sessions"
          icon={Mic}
          trend={data.interviews_change_pct}
          badgeLabel="This week"
          badgeTone="good"
        />
        <MetricCard
          label="Average Score"
          value={hasData ? String(data.avg_score) : "-"}
          suffix={hasData ? "/ 100" : undefined}
          sub="Across completed interviews"
          icon={Target}
          trend={data.avg_score_change_pct}
          badgeLabel="Latest score"
          badgeTone="good"
        />
        <MetricCard
          label="Total Practice Time"
          value={formatPracticeTime(data.practice_minutes)}
          sub="Time in scored sessions"
          icon={Clock3}
          trend={data.practice_change_pct}
          badgeLabel="This month"
        />
        <MetricCard
          label="Current Streak"
          value={`${data.streak} ${data.streak === 1 ? "day" : "days"}`}
          sub={data.longest_streak ? `Longest streak: ${data.longest_streak} days` : "Keep the habit going"}
          icon={Flame}
          badgeLabel="Keep it up"
          badgeTone="good"
        />
      </section>

      <section className="ic-grid-main">
        <PerformanceChart initialDays={30} />
        <SkillBreakdown dimensions={data.dimensions} />
      </section>

      <section className="ic-insights">
        <CoachCard insights={data.coach} />
        <PreparationGoals goals={data.upcoming_goals} onChanged={refresh} />
      </section>

      <section className="ic-card ic-recent">
        <RecentInterviews interviews={data.recent_interviews} />
      </section>
    </div>
  );
}
