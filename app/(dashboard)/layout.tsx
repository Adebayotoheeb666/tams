import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userName={session.user.name}
      userRole={session.user.role}
    >
      {children}
    </DashboardShell>
  );
}
