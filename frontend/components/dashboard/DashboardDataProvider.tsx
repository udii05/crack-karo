"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { Dashboard, api } from "@/lib/api";

type DashboardContextValue = {
  data: Dashboard | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await api.dashboard();
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (pathname === "/dashboard" && previousPath.current !== "/dashboard") {
      void load(true);
    }
    previousPath.current = pathname;
  }, [pathname, load]);

  return (
    <DashboardContext.Provider
      value={{
        data,
        loading,
        error,
        refresh: () => load(true),
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardData must be used inside DashboardDataProvider");
  }
  return context;
}
