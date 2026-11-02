import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { CoachDimension } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";

export default function SkillBreakdown({
  dimensions,
  showLink = true,
}: {
  dimensions: CoachDimension[];
  showLink?: boolean;
}) {
  const strongest = dimensions.length
    ? dimensions.reduce((best, row) => (row.score > best.score ? row : best))
    : null;
  const weakest = dimensions.length
    ? dimensions.reduce((worst, row) => (row.score < worst.score ? row : worst))
    : null;

  return (
    <article className="ic-card ic-panel">
      <div className="ic-panel-head">
        <div>
          <div className="ic-panel-title">Skill breakdown</div>
          <div className="ic-panel-sub">A snapshot of your current strengths</div>
        </div>
        {showLink && (
          <Link href="/dashboard/skills" className="ic-text-link">
            View all →
          </Link>
        )}
      </div>

      {dimensions.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No skill scores yet"
          description="Complete a mock interview and your answer dimensions will be summarised here."
        />
      ) : (
        <>
          <div className="ic-skills">
            {dimensions.map((row) => (
              <div
                key={row.key}
                className="ic-skill-row"
                title={`${row.label}: ${row.score} out of 100${
                  row.delta !== null && row.delta !== undefined
                    ? ` (${row.delta > 0 ? "+" : ""}${row.delta} change)`
                    : ""
                }`}
              >
                <span className="ic-skill-name">{row.label}</span>
                <div className="ic-track">
                  <div
                    className="ic-fill"
                    style={{ width: `${Math.max(0, Math.min(100, row.score))}%` }}
                  />
                </div>
                <span className="ic-skill-score">{Math.round(row.score)}</span>
              </div>
            ))}
          </div>
          {(strongest || weakest) && (
            <div className="ic-panel-sub" style={{ marginTop: 17 }}>
              {strongest && <>Strongest: {strongest.label}</>}
              {strongest && weakest && <span style={{ margin: "0 6px" }}>·</span>}
              {weakest && <>Focus: {weakest.label}</>}
            </div>
          )}
        </>
      )}
    </article>
  );
}
