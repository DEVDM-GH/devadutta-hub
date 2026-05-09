"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  Droplets,
  Moon,
  Flame,
  Dumbbell,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn, formatDate } from "@/lib/utils";

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

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  calories: "",
  waterL: "",
  sleepHrs: "",
  workoutDone: false,
  notes: "",
};

const WORKOUT_SUGGESTIONS = [
  {
    day: "Monday",
    focus: "Upper Body Strength",
    exercises: ["Push-ups 3×15", "Dumbbell rows 3×12", "Shoulder press 3×12", "Tricep dips 3×15"],
  },
  {
    day: "Tuesday",
    focus: "Cardio + Badminton",
    exercises: ["30 min badminton / brisk walk", "Jump rope 3×2min", "Core plank 3×45s"],
  },
  {
    day: "Wednesday",
    focus: "Lower Body",
    exercises: ["Squats 4×15", "Lunges 3×12 each", "Calf raises 3×20", "Glute bridges 3×15"],
  },
  {
    day: "Thursday",
    focus: "Active Recovery",
    exercises: ["30 min swimming / yoga", "Stretch routine 15min", "Light walk"],
  },
  {
    day: "Friday",
    focus: "Full Body HIIT",
    exercises: ["Burpees 3×10", "Mountain climbers 3×30s", "Jump squats 3×12", "Push-ups 3×15"],
  },
  {
    day: "Saturday",
    focus: "Outdoor Activity",
    exercises: ["Trekking / cycling / football", "1+ hour of activity", "Enjoy it!"],
  },
  {
    day: "Sunday",
    focus: "Rest & Recover",
    exercises: ["Light stretching", "Meal prep", "Hydration focus (3L water)"],
  },
];

const DIET_TIPS = [
  "Start your day with 500ml water before coffee. You're at a desk most of the day — hydration prevents afternoon energy crashes.",
  "Protein at every meal: eggs/paneer/dal at breakfast, chicken/fish/tofu at lunch, legumes at dinner. Aim for 1.6g per kg bodyweight.",
  "Your Bangalore work schedule likely means late dinners. Eat a small healthy snack at 6pm (nuts, fruit) to avoid overeating post 8pm.",
  "Pre-workout fuel: a banana + 2 boiled eggs or a small bowl of oats 45 min before training.",
  "Avoid UberEats/Swiggy more than 3× a week. The hidden oil and sodium in restaurant food is a silent saboteur.",
  "Cooking new cuisines (your hobby!) is actually great for health — home cooked is always better. Batch cook on Sundays.",
  "Creatine monohydrate (5g/day) is the most researched, cheapest supplement for desk workers who also train. Consider adding it.",
];

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} className={color} />
        {trend && (
          <span className={cn("text-xs", trend === "down" ? "text-emerald-400" : trend === "up" ? "text-orange-400" : "text-slate-500")}>
            {trend === "down" ? <TrendingDown size={14} /> : trend === "up" ? <TrendingUp size={14} /> : <Minus size={14} />}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export default function HealthPage() {
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "log" | "workout" | "diet">("overview");

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const res = await fetch("/api/health");
    const data = await res.json();
    setEntries(data);
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
    fetchEntries();
  }

  async function deleteEntry(id: number) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/health?id=${id}`, { method: "DELETE" });
    fetchEntries();
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last30 = sorted.slice(-30);
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const avgSleep = latest
    ? (entries.filter((e) => e.sleepHrs).reduce((s, e) => s + (e.sleepHrs ?? 0), 0) /
        entries.filter((e) => e.sleepHrs).length || 0
      ).toFixed(1)
    : "--";

  const avgCalories = latest
    ? Math.round(
        entries.filter((e) => e.calories).reduce((s, e) => s + (e.calories ?? 0), 0) /
          entries.filter((e) => e.calories).length || 0
      )
    : "--";

  const weightTrend =
    latest?.weightKg && prev?.weightKg
      ? latest.weightKg < prev.weightKg
        ? "down"
        : latest.weightKg > prev.weightKg
        ? "up"
        : "flat"
      : undefined;

  const workoutsThisWeek = entries.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return e.workoutDone && d >= weekStart;
  }).length;

  const chartData = last30.map((e) => ({
    date: e.date.slice(5),
    weight: e.weightKg,
    calories: e.calories,
    sleep: e.sleepHrs,
    water: e.waterL,
  }));

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Health <span className="gradient-text">Hub</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Track your body, fuel your performance, stay consistent.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
        >
          <Plus size={16} />
          Log Today
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <form
          onSubmit={saveEntry}
          className="bg-slate-900 border border-pink-500/20 rounded-xl p-6 mb-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-pink-400">Log Health Entry</h3>
            <button type="button" onClick={() => setShowForm(false)}>
              <X size={16} className="text-slate-500 hover:text-slate-300" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                placeholder="72.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
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
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Water (litres)</label>
              <input
                type="number"
                step="0.1"
                value={form.waterL}
                onChange={(e) => setForm({ ...form, waterL: e.target.value })}
                placeholder="2.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                value={form.sleepHrs}
                onChange={(e) => setForm({ ...form, sleepHrs: e.target.value })}
                placeholder="7.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.workoutDone}
                  onChange={(e) => setForm({ ...form, workoutDone: e.target.checked })}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-sm text-slate-300">Workout done today</span>
              </label>
            </div>
          </div>
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
            className="bg-pink-500 hover:bg-pink-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["overview", "log", "workout", "diet"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              activeTab === tab
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/30"
                : "text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700"
            )}
          >
            {tab === "overview" && "📊 "}
            {tab === "log" && "📋 "}
            {tab === "workout" && "💪 "}
            {tab === "diet" && "🥗 "}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Heart}
              label="Latest Weight"
              value={latest?.weightKg ?? "--"}
              unit="kg"
              trend={weightTrend}
              color="text-pink-400"
            />
            <StatCard
              icon={Flame}
              label="Avg Calories"
              value={avgCalories}
              unit="kcal"
              color="text-orange-400"
            />
            <StatCard
              icon={Moon}
              label="Avg Sleep"
              value={avgSleep}
              unit="hrs"
              color="text-purple-400"
            />
            <StatCard
              icon={Dumbbell}
              label="Workouts This Week"
              value={workoutsThisWeek}
              unit="/ 5"
              color="text-cyan-400"
            />
          </div>

          {/* Weight Chart */}
          {chartData.length > 0 ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-sm mb-4 text-slate-300">Weight Trend (last 30 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#ec4899" fill="url(#weightGrad)" strokeWidth={2} dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-semibold text-sm mb-4 text-slate-300">Daily Calories</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                      />
                      <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-semibold text-sm mb-4 text-slate-300">Sleep Hours</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                      />
                      <Bar dataKey="sleep" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-12 text-center">
              <Heart size={40} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 mb-1">No health data yet.</p>
              <p className="text-slate-600 text-sm">Click "Log Today" to add your first entry.</p>
            </div>
          )}
        </div>
      )}

      {/* LOG TAB */}
      {activeTab === "log" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No entries yet.</div>
          ) : (
            [...entries]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 group"
                >
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={12} />
                    {formatDate(entry.date)}
                  </div>
                  {entry.weightKg && (
                    <span className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded">
                      {entry.weightKg} kg
                    </span>
                  )}
                  {entry.calories && (
                    <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded">
                      {entry.calories} kcal
                    </span>
                  )}
                  {entry.waterL && (
                    <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">
                      <Droplets size={10} className="inline mr-1" />
                      {entry.waterL}L
                    </span>
                  )}
                  {entry.sleepHrs && (
                    <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                      <Moon size={10} className="inline mr-1" />
                      {entry.sleepHrs}h
                    </span>
                  )}
                  {entry.workoutDone && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <Dumbbell size={10} className="inline mr-1" />
                      Workout ✓
                    </span>
                  )}
                  {entry.notes && (
                    <span className="text-xs text-slate-500 italic flex-1 truncate">"{entry.notes}"</span>
                  )}
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 rounded text-slate-600 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
          )}
        </div>
      )}

      {/* WORKOUT TAB */}
      {activeTab === "workout" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4 text-sm text-slate-400 mb-6">
            <span className="text-cyan-400 font-semibold">Personalised for you: </span>
            Desk job (Bangalore fintech) + active hobbies (trekking, swimming, badminton, football). 5 training days, 1 active fun day, 1 rest day.
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {WORKOUT_SUGGESTIONS.map((day) => (
              <div key={day.day} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm">{day.day}</span>
                  <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    {day.focus}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {day.exercises.map((ex) => (
                    <li key={ex} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-cyan-500 mt-0.5">›</span>
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIET TAB */}
      {activeTab === "diet" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4 text-sm text-slate-400 mb-6">
            <span className="text-emerald-400 font-semibold">Dietary guidance for your lifestyle: </span>
            Based on a Bangalore desk job, active hobbies, and your love for cooking. These are practical, not preachy.
          </div>
          {DIET_TIPS.map((tip, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-3 hover:border-slate-700 transition-all">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center shrink-0 font-bold">
                {i + 1}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
            </div>
          ))}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-4">
            <h3 className="font-semibold text-sm mb-3 text-emerald-400">Sample Daily Meal Plan</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <div><span className="text-slate-300 font-medium">Breakfast (7-8am):</span> 3 boiled eggs + 2 whole wheat rotis + 1 fruit + black coffee</div>
              <div><span className="text-slate-300 font-medium">Mid-morning (10am):</span> Handful of mixed nuts + 1 banana</div>
              <div><span className="text-slate-300 font-medium">Lunch (1pm):</span> Dal/chicken + 2 rotis/rice + sabzi + salad</div>
              <div><span className="text-slate-300 font-medium">Pre-workout (5pm):</span> Oats with milk or banana + peanut butter</div>
              <div><span className="text-slate-300 font-medium">Dinner (8pm):</span> Grilled protein + salad + 1 roti — light on carbs</div>
              <div><span className="text-slate-300 font-medium">Hydration:</span> 3L water spread through the day. Set a reminder every 2 hours.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
