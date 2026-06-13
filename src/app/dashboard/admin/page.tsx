import { prisma } from "@/lib/prisma";
import { getAllManagedEmails, getPersona } from "@/lib/access";
import RefreshCoachingPanel from "../RefreshCoachingPanel";

export default async function AdminPage() {
  const agg = await prisma.healthInsight.aggregate({ _max: { generatedAt: true } });
  const lastRefreshedAt = agg._max.generatedAt?.toISOString() ?? null;

  const users = getAllManagedEmails().map((email) => ({
    email,
    persona: getPersona(email),
  }));

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Admin</p>
        <h1 className="text-2xl font-bold mb-1">Control Panel</h1>
        <p className="text-slate-400 text-sm">
          Manage Gemini coaching for all Health Pulse users. More controls coming soon.
        </p>
      </div>

      <RefreshCoachingPanel
        initialLastRefreshedAt={lastRefreshedAt}
        users={users}
      />
    </div>
  );
}
