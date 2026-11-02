"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, RotateCcw } from "lucide-react";
import { Performance, api } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const FILTERS = [
  { label: "Last 30 days", value: 30 },
  { label: "Last 7 days", value: 7 },
  { label: "Last 90 days", value: 90 },
  { label: "All time", value: 0 },
];

// Exact geometry from the approved prototype.
const WIDTH = 620;
const HEIGHT = 190;
const PAD_LEFT = 35;
const PAD_RIGHT = 10;
const TOP_GRID = 20;
const BOTTOM_GRID = 155;
const PX_PER_POINT = (BOTTOM_GRID - TOP_GRID) / 75; // 100 -> 20, 25 -> 155
const LABEL_X = [35, 175, 320, 465, 585];

function shortDate(value: string): string {
  const date = new Date(value);
  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return "Today";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function yForScore(score: number): number {
  const clamped = Math.max(25, Math.min(100, score));
  return TOP_GRID + (100 - clamped) * PX_PER_POINT;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${PAD_LEFT} ${points[0].y} L ${WIDTH - PAD_RIGHT} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export default function PerformanceChart({ initialDays = 30 }: { initialDays?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(value: number) {
    setLoading(true);
    setError("");
    try {
      setData(await api.performance(value));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load performance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const geometry = useMemo(() => {
    const points = data?.points ?? [];
    const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
    const coords = points.map((point, index) => {
      const x =
        points.length <= 1
          ? PAD_LEFT
          : PAD_LEFT + (index / (points.length - 1)) * plotWidth;
      return { ...point, x, y: yForScore(point.score) };
    });
    const line = smoothPath(coords);
    const area =
      coords.length > 0
        ? `${line} L ${WIDTH - PAD_RIGHT} ${BOTTOM_GRID} L ${PAD_LEFT} ${BOTTOM_GRID} Z`
        : "";
    return { coords, line, area };
  }, [data]);

  const lastCoord =
    geometry.coords.length === 1
      ? { ...geometry.coords[0], x: WIDTH - PAD_RIGHT }
      : geometry.coords[geometry.coords.length - 1] ?? null;
  const labelIndices = useMemo(() => {
    const total = data?.points.length ?? 0;
    if (total === 0) return [];
    if (total === 1) return [0];
    const count = Math.min(5, total);
    return Array.from({ length: count }).map((_, index) =>
      Math.round((index * (total - 1)) / (count - 1))
    );
  }, [data]);

  return (
    <article className="ic-card ic-panel">
      <div className="ic-panel-head">
        <div>
          <div className="ic-panel-title">Performance overview</div>
          <div className="ic-panel-sub">Your interview scores over time</div>
        </div>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          aria-label="Chart range"
          className="ic-select"
        >
          {FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </select>
      </div>

      {loading && <Skeleton className="h-[190px] w-full rounded-xl" />}

      {!loading && error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void load(days)} className="ic-btn ic-btn-secondary">
            <RotateCcw />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && data.points.length === 0 && (
        <EmptyState
          icon={LineChart}
          title="No performance data yet"
          description="Complete a mock interview and your score trend will appear here."
        />
      )}

      {!loading && !error && data && data.points.length > 0 && (
        <>
          <div className="ic-chart-wrap">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`Interview performance chart. Average ${data.average}.`}
            >
              <defs>
                <linearGradient id="icArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#6e9bea" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#6e9bea" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[100, 75, 50, 25].map((tick) => {
                const y = yForScore(tick);
                return (
                  <line
                    key={tick}
                    className="ic-chart-grid"
                    x1={PAD_LEFT}
                    x2={WIDTH - PAD_RIGHT}
                    y1={y}
                    y2={y}
                  />
                );
              })}
              <text className="ic-chart-label" x="4" y="23">100</text>
              <text className="ic-chart-label" x="10" y="68">75</text>
              <text className="ic-chart-label" x="10" y="113">50</text>
              <text className="ic-chart-label" x="10" y="158">25</text>

              {geometry.area && <path className="ic-chart-area" d={geometry.area} />}
              {geometry.line && <path className="ic-chart-line" d={geometry.line} />}

              {lastCoord && (
                <circle
                  className="ic-chart-dot"
                  cx={lastCoord.x}
                  cy={lastCoord.y}
                  r="4.5"
                />
              )}

              {labelIndices.map((index, position) => {
                const point = data.points[index];
                if (!point) return null;
                const labelX =
                  labelIndices.length === 1
                    ? LABEL_X[LABEL_X.length - 1]
                    : LABEL_X[
                        Math.round(
                          (position * (LABEL_X.length - 1)) /
                            Math.max(1, labelIndices.length - 1)
                        )
                      ];
                return (
                  <text
                    key={index}
                    x={labelX}
                    y="180"
                    className="ic-chart-label"
                  >
                    {shortDate(point.date)}
                  </text>
                );
              })}
            </svg>
          </div>
          <div className="ic-chart-legend">
            <span className="ic-legend-dot" />
            Interview score
            <span className="ml-auto">Updated after each session</span>
          </div>
        </>
      )}
    </article>
  );
}
