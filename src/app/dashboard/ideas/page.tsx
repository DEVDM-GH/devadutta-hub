"use client";

import { useState, useEffect, useRef } from "react";
import {
  Lightbulb,
  Pin,
  PinOff,
  Trash2,
  Plus,
  Search,
  Filter,
  Tag,
  Calendar,
  BookOpen,
  Rocket,
  TrendingUp,
  Code,
  ArrowUpDown,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { GenerateIdeasResponse } from "@/app/api/admin/generate-ideas/route";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

type Idea = {
  id: number;
  category: string;
  title: string;
  content: string;
  tags: string;
  pinned: boolean;
  createdAt: string;
};

const CATEGORIES = [
  { label: "All", value: "all", icon: Lightbulb },
  { label: "Career", value: "career", icon: TrendingUp },
  { label: "Projects", value: "project", icon: Rocket },
  { label: "Learning", value: "learning", icon: BookOpen },
  { label: "Technical", value: "technical", icon: Code },
  { label: "General", value: "general", icon: Tag },
];

const CATEGORY_COLORS: Record<string, string> = {
  career: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  project: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  learning: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  technical: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  general: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

type SortOption = "newest" | "oldest" | "title";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Title (A–Z)", value: "title" },
];

function sortIdeas(list: Idea[], sortBy: SortOption): Idea[] {
  const sorted = [...list];
  switch (sortBy) {
    case "oldest":
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "newest":
    default:
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return sorted;
}

function parseTags(tags: string): string[] {
  return tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "career",
    title: "",
    content: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    setLoading(true);
    const res = await fetch("/api/ideas");
    const data = await res.json();
    setIdeas(data);
    setLoading(false);
  }

  async function togglePin(idea: Idea) {
    await fetch("/api/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idea.id, pinned: !idea.pinned }),
    });
    fetchIdeas();
  }

  async function deleteIdea(id: number) {
    if (!confirm("Delete this idea?")) return;
    await fetch(`/api/ideas?id=${id}`, { method: "DELETE" });
    fetchIdeas();
  }

  async function handleGenerateIdeas() {
    setGenerating(true);
    setGenerateMessage(null);
    try {
      const res = await fetch("/api/admin/generate-ideas", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setGenerateMessage({ type: "error", text: data.error ?? "Failed to generate ideas." });
        return;
      }

      const { count } = data as GenerateIdeasResponse;
      setGenerateMessage({
        type: "success",
        text: `Added ${count} new idea${count === 1 ? "" : "s"}.`,
      });
      await fetchIdeas();
    } catch {
      setGenerateMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setGenerating(false);
    }
  }

  async function saveIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSaving(true);
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ category: "career", title: "", content: "", tags: "" });
    setShowForm(false);
    fetchIdeas();
  }

  const filtered = ideas.filter((idea) => {
    const matchCat = activeCategory === "all" || idea.category === activeCategory;
    const matchSearch =
      !search ||
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      idea.content.toLowerCase().includes(search.toLowerCase()) ||
      idea.tags.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || parseTags(idea.tags).includes(activeTag);
    return matchCat && matchSearch && matchTag;
  });

  const sortedFiltered = sortIdeas(filtered, sortBy);
  const pinned = sortedFiltered.filter((i) => i.pinned);
  const unpinned = sortedFiltered.filter((i) => !i.pinned);

  function handleTagClick(tag: string) {
    setActiveTag((current) => (current === tag ? null : tag));
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            AI <span className="gradient-text">Idea Lab</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Career ideas, project concepts, and learning paths tailored to your profile.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
        >
          <Plus size={16} />
          Add Idea
        </button>
      </div>

      {/* Generate ideas banner */}
      <div className="bg-slate-900 border border-purple-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Lightbulb size={18} className="text-purple-400 mt-0.5 shrink-0" />
        <div className="text-sm flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <span className="font-semibold text-purple-400">Generate ideas with Gemini</span>
            <button
              onClick={handleGenerateIdeas}
              disabled={generating}
              className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {generating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Generate Ideas
                </>
              )}
            </button>
          </div>
          <span className="text-slate-400">
            Calls Gemini with your profile prompt (
            <code className="bg-slate-800 px-1 rounded text-xs">scripts/idea-prompt.md</code>) and
            adds fresh ideas straight into the list below. Needs{" "}
            <code className="bg-slate-800 px-1 rounded text-xs">GEMINI_API_KEY</code> in{" "}
            <code className="bg-slate-800 px-1 rounded text-xs">.env.local</code>. No key? Paste
            the prompt into Cursor chat instead, save the JSON to{" "}
            <code className="bg-slate-800 px-1 rounded text-xs">scripts/ideas-output.json</code>,
            then run <code className="bg-slate-800 px-1 rounded text-xs">npm run seed-ideas</code>.
          </span>
          {generateMessage && (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                generateMessage.type === "success" ? "text-emerald-400" : "text-red-400"
              )}
            >
              {generateMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Ideas", value: ideas.length },
          { label: "Pinned", value: ideas.filter((i) => i.pinned).length },
          {
            label: "Categories",
            value: new Set(ideas.map((i) => i.category)).size,
          },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Idea Form */}
      {showForm && (
        <form
          onSubmit={saveIdea}
          className="bg-slate-900 border border-cyan-500/20 rounded-xl p-6 mb-6 space-y-4"
        >
          <h3 className="font-semibold text-sm text-cyan-400 mb-2">Add New Idea</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tags (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="AI, MCP, career..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Idea title..."
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Describe the idea, steps, resources..."
              required
              rows={5}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Idea"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-slate-700 hover:border-slate-500 text-slate-400 px-4 py-2 rounded-lg text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className={cn("flex flex-wrap items-center gap-3", activeTag ? "mb-3" : "mb-6")}>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                activeCategory === cat.value
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600"
              )}
            >
              <cat.icon size={12} />
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <ArrowUpDown size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort ideas"
            className="appearance-none bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-600 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTag && (
        <div className="flex items-center gap-2 mb-6 text-xs">
          <span className="text-slate-500">Filtering by tag:</span>
          <button
            onClick={() => setActiveTag(null)}
            className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full font-medium hover:bg-cyan-500/20 transition-colors"
          >
            #{activeTag}
            <X size={12} />
          </button>
        </div>
      )}

      {/* Ideas List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading ideas...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={40} className="text-slate-700 mx-auto mb-4" />
          {ideas.length === 0 ? (
            <>
              <p className="text-slate-500 mb-2">No ideas yet.</p>
              <p className="text-slate-600 text-sm">
                Run the seed script or click &quot;Add Idea&quot; to get started.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-500 mb-2">No ideas match your filters.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                  setActiveTag(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                <Pin size={12} /> Pinned
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {pinned.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onPin={togglePin}
                    onDelete={deleteIdea}
                    activeTag={activeTag}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <Filter size={12} /> All Ideas
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {unpinned.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onPin={togglePin}
                    onDelete={deleteIdea}
                    activeTag={activeTag}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaCard({
  idea,
  onPin,
  onDelete,
  activeTag,
  onTagClick,
}: {
  idea: Idea;
  onPin: (i: Idea) => void;
  onDelete: (id: number) => void;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const colorClass =
    CATEGORY_COLORS[idea.category] || CATEGORY_COLORS.general;
  const tags = parseTags(idea.tags);

  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  // Only re-measure while collapsed — the clamp's scrollHeight vs clientHeight
  // gap is what tells us the text actually overflows 4 lines. Skipping this
  // while expanded avoids the collapsed/expanded heights being equal and
  // flipping "Show less" back off.
  useEffect(() => {
    if (expanded) return;
    const el = contentRef.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > el.clientHeight + 1);
  }, [idea.content, expanded]);

  return (
    <div
      className={cn(
        "bg-slate-900 border rounded-xl p-5 flex flex-col gap-3 hover:border-slate-600 transition-all group",
        idea.pinned ? "border-cyan-500/30" : "border-slate-800"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded border capitalize", colorClass)}>
          {idea.category}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPin(idea)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors"
            title={idea.pinned ? "Unpin" : "Pin"}
          >
            {idea.pinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-sm leading-snug">{idea.title}</h3>
      <div className="flex-1">
        <p
          ref={contentRef}
          className={cn(
            "text-xs text-slate-400 leading-relaxed",
            !expanded && "line-clamp-4"
          )}
        >
          {idea.content}
        </p>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium mt-1"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              aria-pressed={activeTag === tag}
              title={activeTag === tag ? `Clear "${tag}" filter` : `Filter by "${tag}"`}
              className={cn(
                "text-xs px-2 py-0.5 rounded transition-colors",
                activeTag === tag
                  ? "text-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-500/40"
                  : "text-slate-500 bg-slate-800 hover:bg-slate-700 hover:text-slate-300"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-slate-600">
        <Calendar size={10} />
        {formatDate(idea.createdAt)}
      </div>
    </div>
  );
}
