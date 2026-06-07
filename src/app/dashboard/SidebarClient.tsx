"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Lightbulb,
  Heart,
  Home,
  ChevronRight,
  Cpu,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// module: null means always visible (no access check needed)
const ALL_NAV_ITEMS = [
  { href: "/dashboard",        label: "Dashboard",   icon: LayoutDashboard, module: null     },
  { href: "/dashboard/ideas",  label: "AI Idea Lab", icon: Lightbulb,       module: "ideas"  },
  { href: "/dashboard/health", label: "Health Pulse", icon: Heart,          module: "health" },
];

function SidebarContent({
  userName,
  userEmail,
  userImage,
  allowedModules,
  signOutButton,
  onClose,
}: {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  allowedModules: readonly string[];
  signOutButton: React.ReactNode;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => item.module === null || allowedModules.includes(item.module)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Cpu size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">DevaDutta Hub</div>
            <div className="text-xs text-slate-500 leading-tight">Personal Command Centre</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 md:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              )}
            >
              <item.icon size={18} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
        >
          <Home size={18} />
          Back to Site
        </Link>

        {signOutButton}

        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={userName ?? "User"}
              className="w-7 h-7 rounded-full border border-slate-700"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">
              {userName?.[0]?.toUpperCase() ?? "D"}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs text-slate-300 font-medium truncate">{userName ?? "Devadutta"}</div>
            <div className="text-xs text-slate-600 truncate">{userEmail ?? ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SidebarClient({
  children,
  userName,
  userEmail,
  userImage,
  allowedModules,
  signOutButton,
}: {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  allowedModules: readonly string[];
  signOutButton: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex-col h-screen sticky top-0">
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          allowedModules={allowedModules}
          signOutButton={signOutButton}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          allowedModules={allowedModules}
          signOutButton={signOutButton}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Cpu size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold">DevaDutta Hub</span>
          </div>
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
