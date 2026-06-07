"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  Trash2,
  Droplets,
  Moon,
  Dumbbell,
  X,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from "recharts";
import { cn, formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HealthEntry = {
  id: number;
  date: string;
  weightKg: number | null;
  calories: number | null;
  waterL: number | null;
  sleepHrs: number | null;
  workoutDone: boolean;
  notes: string | null;
  createdAt: string;
};

type HealthInsight = {
  id: number;
  headline: string;
  weeklyRead: string;
  priorities: string[];
  todayAction: string;
  workoutFocus: string;
  generatedAt: string;
  entryCount: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  calories: "",
  waterL: "",
  sleepHrs: "",
  workoutDone: false,
  notes: "",
};

const MIN_ENTRIES_FOR_COACHING = 3;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Chip({
  label,
  color,
  icon: Icon,
}: {
  label: string;
  color: string;
  icon?: React.ElementType;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border", color)}>
      {Icon && <Icon size={9} />}
      {label}
    </span>
  );
}

function Sparkline({
  data,
  dataKey,
  color,
  label,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  label: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-3">{label}</p>
      <ResponsiveContainer width="100%" height={56}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 6,
              fontSize: 11,
              color: "#f1f5f9",
            }}
            labelStyle={{ display: "none" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CoachingCard({ insight }: { insight: HealthInsight | null }) {
  if (!insight) {
    return (
      <div className="bg-slate-900 border border-pink-500/20 border-dashed rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={22} className="text-pink-400" />
        </div>
        <p className="text-slate-300 font-semibold mb-1">Your coaching is waiting</p>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          Log at least {MIN_ENTRIES_FOR_COACHING} days, then run{" "}
          <code className="text-pink-400 bg-pink-500/10 px-1 rounded text-xs">
            npm run generate-health:turso
          </code>{" "}
          to get Gemini coaching built from your data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-pink-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-pink-500/20 px-6 py-4 flex items-start gap-3">
        <Sparkles size={18} className="text-pink-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-pink-400 font-medium mb-1 uppercase tracking-wide">
            Gemini Coaching · from your last {insight.entryCount} {insight.entryCount === 1 ? "entry" : "entries"} · {new Date(insight.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
          <p className="text-slate-100 font-semibold leading-snug">{insight.headline}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Weekly read */}
        <p className="text-slate-300 text-sm leading-relaxed">{insight.weeklyRead}</p>

        {/* Priorities */}
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Top priorities</p>
          <ul className="space-y-2">
            {insight.priorities.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Today action + workout focus */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-slate-800/60 rounded-lg p-4">
            <p className="text-xs text-emerald-400 font-medium mb-1">Today's one action</p>
            <p className="text-sm text-slate-300">{insight.todayAction}</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-4">
            <p className="text-xs text-cyan-400 font-medium mb-1">Workout focus</p>
            <p className="text-sm text-slate-300">{insight.workoutFocus}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 flex items-center gap-1">
          <AlertCircle size={10} />
          Wellness coaching only — not medical advice. Always consult your doctor.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HealthPage() {
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [insight, setInsight] = useState<HealthInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [entriesRes, insightRes] = await Promise.all([
      fetch("/api/health"),
      fetch("/api/health/insight"),
    ]);
    const entriesData = await entriesRes.json();
    setEntries(Array.isArray(entriesData) ? entriesData : []);

    if (insightRes.ok) {
      const insightData = await insightRes.json();
      setInsight(insightData ?? null);
    }
    setLoading(false);
  }

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm(defaultForm);
    setShowForm(false);
    fetchAll();
  }

  async function deleteEntry(id: number) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/health?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  // Derived data
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const last14Spark = sorted.slice(-14).map((e) => ({
    date: e.date.slice(5),
    weight: e.weightKg,
    sleep: e.sleepHrs,
  }));

  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const weightTrend =
    latest?.weightKg && prev?.weightKg
      ? latest.weightKg < prev.weightKg ? "down"
        : latest.weightKg > prev.weightKg ? "up"
        : "flat"
      : null;

  const recentDisplay = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <div className="p-8 max-w-3xl space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Health <span className="gradient-text">Pulse</span>
          </h1>
          <p className="text-slate-400 text-sm">Log your data. Gemini reads the pattern. You get a coach.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shrink-0"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Log Today"}
        </button>
      </div>

      {/* ── Log form ── */}
      {showForm && (
        <form
          onSubmit={saveEntry}
          className="bg-slate-900 border border-pink-500/20 rounded-xl p-6 space-y-4"
        >
          <p className="text-sm font-semibold text-pink-400">Today's entry</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-pink-500"
              />
            </div>
            {/* Sleep */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sleep (hrs)</label>
              <input
                type="number" step="0.5"
                value={form.sleepHrs}
                onChange={(e) => setForm({ ...form, sleepHrs: e.target.value })}
                placeholder="7.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
            {/* Weight */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Weight (kg)</label>
              <input
                type="number" step="0.1"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                placeholder="72.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
            {/* Calories */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Calories</label>
              <input
                type="number"
                value={form.calories}
                onChange={(e) => setForm({ ...form, calories: e.target.value })}
                placeholder="2000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
            {/* Water */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Water (L)</label>
              <input
                type="number" step="0.1"
                value={form.waterL}
                onChange={(e) => setForm({ ...form, waterL: e.target.value })}
                placeholder="2.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
            {/* Workout */}
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.workoutDone}
                  onChange={(e) => setForm({ ...form, workoutDone: e.target.checked })}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-sm text-slate-300">Workout done</span>
              </label>
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="How did you feel today?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-pink-500 hover:bg-pink-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Entry"}
          </button>
        </form>
      )}

      {/* ── Quick stats bar ── */}
      {!loading && entries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {latest?.weightKg && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm">
              <Heart size={13} className="text-pink-400" />
              <span className="text-slate-300 font-medium">{latest.weightKg} kg</span>
              {weightTrend && (
                <span className={cn("ml-0.5", weightTrend === "down" ? "text-emerald-400" : weightTrend === "up" ? "text-orange-400" : "text-slate-500")}>
                  {weightTrend === "down" ? <TrendingDown size={12} /> : weightTrend === "up" ? <TrendingUp size={12} /> : <Minus size={12} />}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm">
            <Calendar size={13} className="text-slate-500" />
            <span className="text-slate-400">{entries.length} {entries.length === 1 ? "entry" : "entries"} logged</span>
          </div>
          {entries.length < MIN_ENTRIES_FOR_COACHING && (
            <div className="flex items-center gap-1.5 bg-pink-500/5 border border-pink-500/20 rounded-lg px-3 py-2 text-sm">
              <Sparkles size={13} className="text-pink-400" />
              <span className="text-pink-300">{MIN_ENTRIES_FOR_COACHING - entries.length} more day{MIN_ENTRIES_FOR_COACHING - entries.length !== 1 ? "s" : ""} until coaching</span>
            </div>
          )}
        </div>
      )}

      {/* ── Gemini coaching card ── */}
      {!loading && <CoachingCard insight={insight} />}

      {/* ── Last 7 entries ── */}
      {!loading && (
        <div>
          <p className="text-sm font-semibold text-slate-400 mb-3">Recent entries</p>
          {recentDisplay.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-10 text-center">
              <Heart size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No entries yet — hit "Log Today" to start.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDisplay.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2.5 group"
                >
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(entry.date)}
                  </span>

                  {entry.sleepHrs && (
                    <Chip label={`${entry.sleepHrs}h sleep`} color="text-purple-400 bg-purple-500/10 border-purple-500/20" icon={Moon} />
                  )}
                  {entry.weightKg && (
                    <Chip label={`${entry.weightKg} kg`} color="text-pink-400 bg-pink-500/10 border-pink-500/20" />
                  )}
                  {entry.calories && (
                    <Chip label={`${entry.calories} kcal`} color="text-orange-400 bg-orange-500/10 border-orange-500/20" />
                  )}
                  {entry.waterL && (
                    <Chip label={`${entry.waterL}L`} color="text-sky-400 bg-sky-500/10 border-sky-500/20" icon={Droplets} />
                  )}
                  {entry.workoutDone && (
                    <Chip label="Workout ✓" color="text-emerald-400 bg-emerald-500/10 border-emerald-500/20" icon={Dumbbell} />
                  )}
                  {entry.notes && (
                    <span className="text-xs text-slate-500 italic flex-1 truncate min-w-0">"{entry.notes}"</span>
                  )}

                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 rounded text-slate-600 hover:text-red-400 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sparklines ── */}
      {!loading && last14Spark.length > 1 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Sparkline data={last14Spark} dataKey="weight" color="#ec4899" label="Weight — last 14 days (kg)" />
          <Sparkline data={last14Spark} dataKey="sleep" color="#a855f7" label="Sleep — last 14 days (hrs)" />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20 text-slate-500 text-sm">Loading your data…</div>
      )}
    </div>
  );
}
