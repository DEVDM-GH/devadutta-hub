import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Page not found</h1>
        <p className="text-slate-500 mb-8">
          This page doesn't exist. Maybe you followed an old link, or mistyped the URL.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition-all"
          >
            Go Home <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-xl transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
