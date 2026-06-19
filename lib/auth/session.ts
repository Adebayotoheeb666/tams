import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/db/schema";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function requireStaffOrOwner() {
  return requireRole("owner", "staff");
}
