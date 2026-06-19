"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { createUserSchema } from "@/lib/validations/appointments";
import { nowIso } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireOwner() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "owner") throw new Error("Forbidden");
  return session;
}

export async function getUsers(): Promise<User[]> {
  await requireOwner();
  return db.query.users.findMany({
    orderBy: [asc(users.name)],
  });
}

export async function createUser(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireOwner();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid user data",
    };
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (existing) {
    return { success: false, error: "A user with this email already exists" };
  }

  const now = nowIso();
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    id,
    email: normalizedEmail,
    passwordHash,
    name,
    role,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/settings");
  return { success: true, data: { id } };
}

export async function toggleUserActive(
  userId: string,
): Promise<ActionResult<{ id: string; isActive: number }>> {
  const session = await requireOwner();

  if (userId === session.user.id) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.role === "owner") {
    return { success: false, error: "Owner accounts cannot be deactivated" };
  }

  const isActive = user.isActive ? 0 : 1;

  await db
    .update(users)
    .set({ isActive, updatedAt: nowIso() })
    .where(eq(users.id, userId));

  revalidatePath("/settings");
  return { success: true, data: { id: userId, isActive } };
}
