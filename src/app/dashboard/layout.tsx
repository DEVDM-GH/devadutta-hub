import { auth } from "@/auth";
import { getAllowedModules } from "@/lib/access";
import SidebarClient from "./SidebarClient";
import SignOutButton from "./SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const allowedModules = getAllowedModules(session?.user?.email);

  return (
    <SidebarClient
      userName={session?.user?.name}
      userEmail={session?.user?.email}
      userImage={session?.user?.image}
      allowedModules={allowedModules as readonly string[]}
      signOutButton={<SignOutButton />}
    >
      {children}
    </SidebarClient>
  );
}
