"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "@/components/brand/BrandMark";
import { useAuth } from "@/lib/auth";
import { DashboardDataProvider } from "./DashboardDataProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <BrandMark className="h-11 w-11" />
          <div className="text-sm font-medium">Loading your workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardDataProvider>
      <div className="ic-app">
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="ic-main">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="ic-content">{children}</main>
        </div>
      </div>
    </DashboardDataProvider>
  );
}

