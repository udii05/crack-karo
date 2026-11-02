import Link from "next/link";
import { Mic } from "lucide-react";
import { Interview } from "@/lib/api";
import {
  formatDate,
  formatMinutes,
  statusLabel,
} from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";

export default function RecentInterviews({
  interviews,
  limit = 5,
  showViewAll = true,
}: {
  interviews: Interview[];
  limit?: number;
  showViewAll?: boolean;
}) {
  const rows = interviews.slice(0, limit);

  return (
    <div>
      <div className="ic-panel-head">
        <div>
          <div className="ic-panel-title">Recent interviews</div>
          <div className="ic-panel-sub">
            Pick up where you left off or review a previous session
          </div>
        </div>
        {showViewAll && (
          <Link href="/dashboard/interview" className="ic-text-link" style={{ marginTop: 0 }}>
            View history →
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No interviews yet"
          description="Start a voice mock interview and your session history will appear here."
          action={
            <Link href="/dashboard/interview/new" className="ic-btn ic-btn-primary">
              Start Mock Interview
            </Link>
          }
        />
      ) : (
        <div className="ic-table-wrap">
          <table className="ic-table">
            <thead>
              <tr>
                <th>INTERVIEW</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>DURATION</th>
                <th>SCORE</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((interview) => (
                <tr key={interview.id}>
                  <td>
                    <div className="ic-role">{interview.title}</div>
                    <div className="ic-type">
                      {interview.difficulty} mock interview
                    </div>
                  </td>
                  <td className="capitalize">{interview.type}</td>
                  <td>{formatDate(interview.created_at)}</td>
                  <td>
                    {interview.actual_duration_minutes !== null
                      ? formatMinutes(interview.actual_duration_minutes)
                      : `${formatMinutes(interview.duration_minutes)} planned`}
                  </td>
                  <td className="ic-score">
                    {interview.overall_score !== null
                      ? `${interview.overall_score} / 100`
                      : "-"}
                  </td>
                  <td>
                    <span
                      className={`ic-status ${
                        interview.status === "in_progress" ? "pending" : ""
                      }`}
                    >
                      {statusLabel(interview.status)}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/interview/${interview.id}`}
                      className="ic-review"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
