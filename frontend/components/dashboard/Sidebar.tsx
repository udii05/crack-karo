"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronUp,
  History,
  LayoutDashboard,
  LogOut,
  Mic,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const starts = (prefix: string) => (pathname: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        isActive: (pathname) => pathname === "/dashboard",
      },
      {
        label: "Mock Interview",
        href: "/dashboard/interview/new",
        icon: Mic,
        isActive: (pathname) => pathname === "/dashboard/interview/new",
      },
      {
        label: "Interview History",
        href: "/dashboard/interview",
        icon: History,
        isActive: (pathname) =>
          pathname.startsWith("/dashboard/interview") &&
          pathname !== "/dashboard/interview/new",
      },
      {
        label: "Performance Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        isActive: starts("/dashboard/analytics"),
      },
    ],
  },
  {
    label: "Preparation",
    items: [
      {
        label: "Question Bank",
        href: "/dashboard/practice",
        icon: BookOpen,
        isActive: starts("/dashboard/practice"),
      },
      {
        label: "Skill Assessment",
        href: "/dashboard/skills",
        icon: Target,
        isActive: starts("/dashboard/skills"),
      },
      {
        label: "AI Coach",
        href: "/dashboard/coach",
        icon: Sparkles,
        isActive: starts("/dashboard/coach"),
      },
      {
        label: "Job Preparation",
        href: "/dashboard/jobs",
        icon: Briefcase,
        isActive: starts("/dashboard/jobs"),
      },
      {
        label: "Live Chat",
        href: "/dashboard/live-chat",
        icon: AudioLines,
        isActive: starts("/dashboard/live-chat"),
      },
    ],
  },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      <div className="ic-brand">
        <div className="ic-brand-mark">
          <AudioLines />
        </div>
        <div className="min-w-0 flex-1">
          <div className="ic-brand-name">Crack Karo</div>
          <div className="ic-brand-sub">Practice workspace</div>
        </div>
      </div>

      <div className="ic-sidebar-nav">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="ic-nav-label">{group.label}</div>
            <nav className="ic-nav">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={active ? "active" : undefined}
                  >
                    <Icon />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="ic-sidebar-bottom">
        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            className={`ic-profile-mini w-full rounded-xl text-left transition-colors hover:bg-[#f8faff] ${
              accountOpen ? "bg-[#f8faff]" : ""
            }`}
          >
            <div className="ic-avatar">{initials(user?.full_name || "Crack Karo")}</div>
            <div className="min-w-0 flex-1">
              <div className="ic-profile-name">{user?.full_name}</div>
              <div className="ic-profile-email">{user?.email}</div>
            </div>
            {accountOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            )}
          </button>

          {accountOpen && (
            <div
              role="menu"
              aria-label="Account menu"
              className="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-xl border border-line bg-white p-1.5 shadow-xl"
            >
              <Link
                href="/dashboard/profile"
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-[#f8faff] hover:text-brand-600"
              >
                <User className="h-3.5 w-3.5" />
                Profile
              </Link>
              {user?.is_admin && (
                <Link
                  href="/dashboard/admin"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-[#f8faff] hover:text-brand-600"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-[#f8faff] hover:text-brand-600"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  onNavigate?.();
                  void logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      <aside className="ic-sidebar ic-sidebar-desktop">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="ic-sidebar-drawer">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="ic-backdrop"
            onClick={onCloseMobile}
          />
          <aside className="ic-sidebar">
            <SidebarBody onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}



