"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Filter,
  Mic,
  RotateCcw,
  Search,
} from "lucide-react";
import { Interview, api } from "@/lib/api";
import {
  formatDate,
  formatMinutes,
  scoreTone,
  statusLabel,
  statusTone,
} from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 10;

export default function InterviewHistoryPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");
  const [scoreRange, setScoreRange] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await api.listInterviews();
      setInterviews(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load interviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) setSearch(query);
  }, []);

  const types = useMemo(
    () => Array.from(new Set(interviews.map((item) => item.type))).sort(),
    [interviews]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff =
      range === "all" ? null : now - Number(range) * 24 * 60 * 60 * 1000;
    return interviews.filter((interview) => {
      if (search.trim()) {
        const term = search.toLowerCase();
        const haystack = `${interview.title} ${interview.type} ${interview.difficulty}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (type !== "all" && interview.type !== type) return false;
      if (status !== "all" && interview.status !== status) return false;
      if (cutoff && new Date(interview.created_at).getTime() < cutoff) return false;
      if (scoreRange !== "all") {
        if (interview.overall_score === null) return false;
        if (scoreRange === "high" && interview.overall_score < 75) return false;
        if (scoreRange === "mid" && (interview.overall_score < 50 || interview.overall_score >= 75)) return false;
        if (scoreRange === "low" && interview.overall_score >= 50) return false;
      }
      return true;
    });
  }, [interviews, search, type, status, range, scoreRange]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, type, status, range, scoreRange]);

  function reset() {
    setSearch("");
    setType("all");
    setStatus("all");
    setRange("all");
    setScoreRange("all");
  }

  const rows = filtered.slice(0, visible);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="ic-page-head mb-0">
          <h1>Interview History</h1>
          <p>Search, filter, and review every practice session.</p>
        </div>
        <Link href="/dashboard/interview/new" className="btn-primary">
          <Mic className="h-4 w-4" />
          New Interview
        </Link>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by role, title, or type..."
              aria-label="Search interviews"
              className="input pl-9"
            />
          </div>
          <button type="button" onClick={reset} className="btn-secondary btn-sm whitespace-nowrap">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </span>
          <select className="input h-9 w-auto py-1.5 text-xs" value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by type">
            <option value="all">All types</option>
            {types.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select className="input h-9 w-auto py-1.5 text-xs" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In progress</option>
          </select>
          <select className="input h-9 w-auto py-1.5 text-xs" value={range} onChange={(event) => setRange(event.target.value)} aria-label="Filter by date">
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select className="input h-9 w-auto py-1.5 text-xs" value={scoreRange} onChange={(event) => setScoreRange(event.target.value)} aria-label="Filter by score">
            <option value="all">Any score</option>
            <option value="high">75 - 100</option>
            <option value="mid">50 - 74</option>
            <option value="low">Below 50</option>
          </select>
        </div>
      </div>

      {loading && <ListSkeleton rows={5} />}

      {!loading && error && (
        <div className="card flex items-center justify-between gap-3">
          <div className="text-sm text-red-700">{error}</div>
          <button type="button" onClick={() => void load()} className="btn-secondary btn-sm">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Mic}
          title={interviews.length === 0 ? "No interviews yet" : "No matching interviews"}
          description={
            interviews.length === 0
              ? "Run your first voice mock interview to start building your history."
              : "Try changing or resetting the filters above."
          }
          action={
            interviews.length === 0 ? (
              <Link href="/dashboard/interview/new" className="btn-primary btn-sm">
                Start Mock Interview
              </Link>
            ) : (
              <button type="button" onClick={reset} className="btn-secondary btn-sm">
                Reset filters
              </button>
            )
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="card p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="text-sm font-medium text-slate-700">
              {filtered.length} {filtered.length === 1 ? "session" : "sessions"}
            </div>
            <div className="text-xs text-slate-400">
              Showing {rows.length} of {filtered.length}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-semibold">Interview</th>
                  <th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Duration</th>
                  <th className="px-3 py-3 font-semibold">Score</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((interview) => (
                  <tr key={interview.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{interview.title}</div>
                      <div className="text-xs capitalize text-slate-400">
                        {interview.difficulty}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 capitalize text-slate-600">{interview.type}</td>
                    <td className="px-3 py-3.5 text-slate-500">{formatDate(interview.created_at)}</td>
                    <td className="px-3 py-3.5 text-slate-500">
                      {interview.actual_duration_minutes !== null
                        ? formatMinutes(interview.actual_duration_minutes)
                        : `${formatMinutes(interview.duration_minutes)} planned`}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex min-w-9 justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${scoreTone(interview.overall_score)}`}>
                        {interview.overall_score !== null ? interview.overall_score : "-"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`badge ${statusTone(interview.status)}`}>
                        {statusLabel(interview.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/interview/${interview.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        Review
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible < filtered.length && (
            <div className="flex justify-center border-t border-slate-100 px-5 py-3">
              <button type="button" onClick={() => setVisible((count) => count + PAGE_SIZE)} className="btn-secondary btn-sm">
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
