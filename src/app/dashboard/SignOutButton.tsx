import { signOut } from "@/auth";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </form>
  );
}
