"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Menu,
  Mic,
  Search,
  Trophy,
} from "lucide-react";
import { useDashboardData } from "./DashboardDataProvider";

const TITLES: { match: RegExp; title: string }[] = [
  { match: /^\/dashboard$/, title: "Dashboard" },
  { match: /^\/dashboard\/interview\/new/, title: "Mock Interview" },
  { match: /^\/dashboard\/interview\/[^/]+/, title: "Interview Report" },
  { match: /^\/dashboard\/interview/, title: "Interview History" },
  { match: /^\/dashboard\/analytics/, title: "Performance Analytics" },
  { match: /^\/dashboard\/practice/, title: "Question Bank" },
  { match: /^\/dashboard\/skills/, title: "Skill Assessment" },
  { match: /^\/dashboard\/coach/, title: "AI Coach" },
  { match: /^\/dashboard\/jobs/, title: "Job Preparation" },
  { match: /^\/dashboard\/live-chat/, title: "Live Chat" },
  { match: /^\/dashboard\/copilot/, title: "Live Chat" },
  { match: /^\/dashboard\/profile/, title: "Profile" },
  { match: /^\/dashboard\/settings/, title: "Settings" },
  { match: /^\/dashboard\/admin/, title: "Admin" },
];

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useDashboardData();
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const pageTitle =
    TITLES.find((entry) => entry.match.test(pathname))?.title ?? "Dashboard";

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const notifications: {
    id: string;
    title: string;
    detail: string;
    href: string;
    icon: typeof Mic;
  }[] = [];

  if (data?.active_interview) {
    notifications.push({
      id: "active",
      title: "Interview in progress",
      detail: data.active_interview.title,
      href: `/dashboard/interview/new?resume=${data.active_interview.id}`,
      icon: Mic,
    });
  }
  if (data?.upcoming_goals?.[0]) {
    const goal = data.upcoming_goals[0];
    notifications.push({
      id: `goal-${goal.id}`,
      title: "Upcoming preparation",
      detail: `${goal.company} - ${goal.role}`,
      href: "/dashboard",
      icon: CalendarClock,
    });
  }
  const latest = data?.recent_interviews?.[0];
  if (latest) {
    notifications.push({
      id: `latest-${latest.id}`,
      title: "Latest interview report",
      detail: `${latest.title} - score ${latest.overall_score ?? "pending"}`,
      href: `/dashboard/interview/${latest.id}`,
      icon: Trophy,
    });
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/dashboard/interview?q=${encodeURIComponent(term)}` : "/dashboard/interview");
  }

  return (
    <header className="ic-topbar">
      <div className="ic-top-left">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="ic-icon-btn ic-mobile-menu"
        >
          <Menu />
        </button>
        <div>
          <div className="ic-crumb">Workspace › {pageTitle}</div>
          <div className="ic-page-title">{pageTitle}</div>
        </div>
      </div>

      <div className="ic-top-actions">
        <form onSubmit={submitSearch} className="ic-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search interviews..."
            aria-label="Search interviews"
          />
        </form>

        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
            className="ic-icon-btn"
          >
            <Bell />
            {notifications.length > 0 && <span className="ic-dot" />}
          </button>
          {notificationsOpen && (
            <div className="ic-dropdown">
              <div className="ic-dropdown-label">Notifications</div>
              {notifications.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-slate-500">
                  You are all caught up.
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setNotificationsOpen(false)}
                      className="ic-dropdown-link"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="ic-dropdown-title block">{item.title}</span>
                        <span className="ic-dropdown-sub block truncate">{item.detail}</span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

