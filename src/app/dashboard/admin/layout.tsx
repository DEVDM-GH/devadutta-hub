import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
