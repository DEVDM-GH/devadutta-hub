import { auth } from "@/auth";
import SidebarClient from "./SidebarClient";
import SignOutButton from "./SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SidebarClient
      userName={session?.user?.name}
      userEmail={session?.user?.email}
      userImage={session?.user?.image}
      signOutButton={<SignOutButton />}
    >
      {children}
    </SidebarClient>
  );
}
