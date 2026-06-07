import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess } from "@/lib/access";

/**
 * Server-side route guard for the AI Idea Lab.
 * Non-admin users are redirected to /dashboard before the page renders.
 * The client component (ideas/page.tsx) never loads for them.
 */
export default async function IdeasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!canAccess(session?.user?.email, "ideas")) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
