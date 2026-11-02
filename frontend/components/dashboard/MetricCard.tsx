import type { LucideIcon } from "lucide-react";

export default function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  badgeLabel,
  badgeTone = "neutral",
  suffix,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  trend?: number | null;
  badgeLabel?: string;
  badgeTone?: "good" | "neutral" | "warn";
  suffix?: string;
}) {
  const hasTrend = trend !== null && trend !== undefined;
  const trendLabel = hasTrend
    ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`
    : badgeLabel;
  const tone = hasTrend
    ? trend >= 0
      ? ""
      : "down"
    : badgeTone === "good"
      ? ""
      : badgeTone === "warn"
        ? "warn"
        : "neutral";

  return (
    <article className="ic-card ic-metric">
      <div className="ic-metric-top">
        <div className="ic-metric-icon">
          <Icon />
        </div>
        {trendLabel && (
          <span className={`ic-metric-trend ${tone}`}>{trendLabel}</span>
        )}
      </div>
      <div className="ic-metric-label">{label}</div>
      <div className="ic-metric-value">
        {value}
        {suffix && <small> {suffix}</small>}
      </div>
      <div className="ic-metric-note">{sub}</div>
    </article>
  );
}
