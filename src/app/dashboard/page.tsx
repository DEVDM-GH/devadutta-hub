import Link from "next/link";
import { Lightbulb, Heart, ArrowRight, Bot, Activity, Cpu } from "lucide-react";
import { auth } from "@/auth";
import { getAllowedModules, getDisplayName } from "@/lib/access";

const ALL_QUICK_LINKS = [
  {
    module: "ideas",
    href: "/dashboard/ideas",
    title: "AI Idea Lab",
    description: "Browse and manage career ideas, project suggestions, and learning paths generated for your profile.",
    icon: Lightbulb,
    accent: "from-cyan-500 to-blue-600",
    border: "border-cyan-500/20 hover:border-cyan-500/50",
  },
  {
    module: "health",
    href: "/dashboard/health",
    title: "Health Pulse",
    description: "Log your metrics, get Gemini-powered coaching tailored to you — your data, your persona, your plan.",
    icon: Heart,
    accent: "from-pink-500 to-rose-600",
    border: "border-pink-500/20 hover:border-pink-500/50",
  },
];

const ALL_TIPS = [
  {
    module: "ideas",
    icon: Bot,
    title: "Generate Ideas",
    body: "Open the AI Idea Lab → paste the prompt from scripts/idea-prompt.md into Cursor → save the output to scripts/ideas-output.json → run npm run seed-ideas.",
  },
  {
    module: "health",
    icon: Activity,
    title: "Track Your Health",
    body: "Log weight, sleep, calories, and workouts in Health Pulse. Run generate-health to get Gemini coaching built from your actual data.",
  },
  {
    module: null,
    icon: Cpu,
    title: "Your Profile",
    body: "Your public landing page at / is live and shows your full portfolio. Share it with recruiters and LinkedIn connections.",
  },
];

export default async function DashboardHome() {
  const session = await auth();
  const email = session?.user?.email;
  const allowedModules = getAllowedModules(email);
  const displayName = getDisplayName(email);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quickLinks = ALL_QUICK_LINKS.filter((l) =>
    (allowedModules as readonly string[]).includes(l.module)
  );

  const tips = ALL_TIPS.filter(
    (t) => t.module === null || (allowedModules as readonly string[]).includes(t.module)
  );

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-slate-500 text-sm mb-1">{greeting},</p>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="gradient-text">{displayName}</span> 👋
        </h1>
        <p className="text-slate-400">
          {email ?? "Your personal command centre"}
        </p>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-4 mb-10 flex items-start gap-3">
        <span className="text-2xl mt-0.5">🚀</span>
        <div>
          <div className="font-semibold text-sm mb-1">Your hub is ready.</div>
          <div className="text-slate-400 text-sm">
            Powered by Gemini — log your data, generate insights, and let the AI coach you. Everything here is built for you.
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold mb-4 text-slate-300">Your Sections</h2>
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group bg-slate-900 border ${link.border} rounded-xl p-6 transition-all hover:bg-slate-900/80`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.accent} flex items-center justify-center`}>
                <link.icon size={20} className="text-white" />
              </div>
              <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-1" />
            </div>
            <h3 className="font-bold text-base mb-2 group-hover:text-cyan-400 transition-colors">
              {link.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Getting Started */}
      <h2 className="text-lg font-semibold mb-4 text-slate-300">Getting Started</h2>
      <div className="space-y-3">
        {tips.map((tip) => (
          <div key={tip.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <tip.icon size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">{tip.title}</div>
              <div className="text-sm text-slate-400">{tip.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
