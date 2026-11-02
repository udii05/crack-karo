import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CoachInsights } from "@/lib/api";

export default function CoachCard({ insights }: { insights: CoachInsights | null }) {
  if (!insights) {
    return (
      <article className="ic-coach-card">
        <div className="ic-coach-top">
          <div className="ic-spark"><Sparkles /></div>
          <div>
            <div className="ic-coach-title">Your AI Coach</div>
            <div className="ic-coach-sub">A little guidance for your next practice session</div>
          </div>
        </div>
        <div className="ic-insight-item">
          <div className="ic-insight-head">Preparing your insights</div>
          <p>Complete your first session to unlock personalised coaching.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="ic-coach-card">
      <div className="ic-coach-top">
        <div className="ic-spark"><Sparkles /></div>
        <div>
          <div className="ic-coach-title">Your AI Coach</div>
          <div className="ic-coach-sub">
            {insights.has_data
              ? "A little guidance for your next practice session"
              : "Complete a session to unlock personalised guidance"}
          </div>
        </div>
      </div>

      {insights.weakest ? (
        <div className="ic-insight-item">
          <div className="ic-insight-head">
            {insights.weakest.label}
            <span className="ic-pill warn">Focus area</span>
          </div>
          <p>
            {insights.next_steps[0] ||
              "Practise explaining your reasoning and trade-offs out loud."}
          </p>
        </div>
      ) : (
        <div className="ic-insight-item">
          <div className="ic-insight-head">
            Start with one mock interview
            <span className="ic-pill warn">Next step</span>
          </div>
          <p>{insights.summary}</p>
        </div>
      )}

      {insights.strongest && (
        <div className="ic-insight-item">
          <div className="ic-insight-head">
            {insights.strongest.label}
            <span className="ic-pill good">Doing well</span>
          </div>
          <p>
            Your answers are strongest here. Keep supporting them with specific examples.
          </p>
        </div>
      )}

      {!insights.has_data && insights.next_steps[1] && (
        <div className="ic-insight-item">
          <div className="ic-insight-head">
            Build a baseline
            <span className="ic-pill good">Suggested</span>
          </div>
          <p>{insights.next_steps[1]}</p>
        </div>
      )}

      <Link href="/dashboard/coach" className="ic-text-link">
        View personalised learning plan →
      </Link>
    </article>
  );
}
