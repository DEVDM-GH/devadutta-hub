import Link from "next/link";
import type { HealthPersona } from "@/lib/access";

const PERSONA_META: Record<HealthPersona, { emoji: string; label: string }> = {
  "fintech-athlete":    { emoji: "🏃", label: "Fintech Athlete"    },
  "natural-bodybuilder":{ emoji: "💪", label: "Natural Bodybuilder" },
  "early-pregnancy":    { emoji: "🤰", label: "Early Pregnancy"     },
};

export default function PersonaTeaser({ persona }: { persona: HealthPersona }) {
  const { emoji, label } = PERSONA_META[persona];

  return (
    <div className="bg-slate-900 border border-pink-500/20 rounded-xl p-5 flex items-start gap-4">
      {/* Persona icon */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0 text-lg">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide">
          You&apos;re being coached as
        </p>
        <p className="font-bold text-base text-slate-100 mb-3">{label}</p>

        {/* Nudge */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-slate-700"
              />
            ))}
          </div>
          <p className="text-sm text-slate-400">
            Log at least{" "}
            <span className="text-pink-400 font-medium">3 days</span> to unlock
            your personalised Gemini coaching
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/health"
        className="shrink-0 text-xs font-semibold text-pink-400 hover:text-pink-300 border border-pink-500/30 hover:border-pink-400/60 rounded-lg px-3 py-1.5 transition-all"
      >
        Log now →
      </Link>
    </div>
  );
}
