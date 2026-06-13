"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Spinner } from "@/components/NavigationOverlay/Spinner";
import type { GenerateResult } from "@/app/api/admin/generate-health/route";

type UserInfo = { email: string; persona: string };

type Props = {
  initialLastRefreshedAt: string | null;
  users: UserInfo[];
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RefreshCoachingPanel({ initialLastRefreshedAt, users }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(initialLastRefreshedAt);
  const [results, setResults] = useState<GenerateResult[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setResults(null);
    setApiError(null);

    try {
      const res = await fetch("/api/admin/generate-health", { method: "POST" });
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        setApiError(data.error ?? "Access denied.");
        return;
      }

      setResults(data.results ?? []);
      setLastRefreshedAt(data.completedAt ?? null);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-base mb-0.5">Refresh Coaching</h2>
          <p className="text-sm text-slate-400">
            Generate fresh Gemini coaching for all {users.length} users in parallel.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Spinner size={14} color="#22d3ee" />
              Refreshing…
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Refresh all users
            </>
          )}
        </button>
      </div>

      {/* Last refreshed */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock size={12} />
        Last refreshed: <span className="text-slate-300">{formatTimestamp(lastRefreshedAt)}</span>
      </div>

      {/* Users list with result chips */}
      <div className="space-y-2">
        {users.map((u) => {
          const result = results?.find((r) => r.email === u.email);
          return (
            <div
              key={u.email}
              className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{u.email}</p>
                <p className="text-xs text-slate-500 capitalize">{u.persona.replace(/-/g, " ")}</p>
              </div>

              {/* Status chip */}
              {loading && !result && (
                <Spinner size={14} color="#94a3b8" />
              )}
              {result && result.ok && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium shrink-0">
                  <CheckCircle size={13} /> Done
                </span>
              )}
              {result && !result.ok && (
                <span
                  className="flex items-center gap-1 text-xs text-red-400 font-medium shrink-0"
                  title={result.error}
                >
                  <XCircle size={13} /> Failed
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* API-level error */}
      {apiError && (
        <p className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}
    </div>
  );
}
