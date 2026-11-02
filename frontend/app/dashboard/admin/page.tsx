"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AdminUser, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setAccounts(await api.adminUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.is_admin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.is_admin]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter(
      (account) =>
        account.full_name.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term)
    );
  }, [accounts, search]);

  if (!user?.is_admin) {
    return (
      <div className="card flex flex-col items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-ink-900">Admin access required</h1>
          <p className="mt-1 text-sm text-slate-500">
            This account directory is available only to the configured administrators.
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary btn-sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="ic-page-head">
        <h1>Admin</h1>
        <p>All accounts in the workspace. Passwords are never exposed here.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="ic-card ic-metric">
          <div className="ic-metric-top">
            <div className="ic-metric-icon">
              <Users />
            </div>
            <span className="ic-metric-trend">Workspace</span>
          </div>
          <div className="ic-metric-label">Total Accounts</div>
          <div className="ic-metric-value">{accounts.length}</div>
          <div className="ic-metric-note">Registered users</div>
        </div>
        <div className="ic-card ic-metric">
          <div className="ic-metric-top">
            <div className="ic-metric-icon">
              <ShieldCheck />
            </div>
            <span className="ic-metric-trend">Secure</span>
          </div>
          <div className="ic-metric-label">Administrators</div>
          <div className="ic-metric-value">
            {accounts.filter((account) => account.is_admin).length}
          </div>
          <div className="ic-metric-note">Allowlisted accounts</div>
        </div>
      </div>

      <div className="ic-card ic-panel">
        <div className="ic-panel-head">
          <div>
            <div className="ic-panel-title">Account directory</div>
            <div className="ic-panel-sub">Name and email only</div>
          </div>
          <div className="ic-search">
            <Search />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search accounts..."
              aria-label="Search accounts"
              style={{ width: 220 }}
            />
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="btn-secondary btn-sm">
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="ic-table-wrap">
            <table className="ic-table">
              <thead>
                <tr>
                  <th>ACCOUNT</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>JOINED</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf0fb] text-[10px] font-bold text-[#315c9d]">
                          {initials(account.full_name)}
                        </span>
                        <span className="ic-role">{account.full_name}</span>
                      </div>
                    </td>
                    <td>{account.email}</td>
                    <td className="capitalize">
                      {account.is_admin ? "Admin" : account.role.replace(/_/g, " ")}
                    </td>
                    <td>{formatDate(account.created_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No accounts match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
