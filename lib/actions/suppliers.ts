"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "@/lib/validations/suppliers";
import { nowIso } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireInventoryAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role === "accountant") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getSuppliers() {
  await requireInventoryAccess();
  return db.query.suppliers.findMany({
    where: suppliers.isActive.eq(1),
    orderBy: [suppliers.name.asc()],
  });
}

export async function getSupplierById(id: string) {
  await requireInventoryAccess();
  const s = await db.query.suppliers.findFirst({ where: suppliers.id.eq(id) });
  return s ?? null;
}

export async function createSupplier(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireInventoryAccess();

  const parsed = createSupplierSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const id = crypto.randomUUID();
  const now = nowIso();

  await db.insert(suppliers).values({
    id,
    name: parsed.data.name,
    contactName: parsed.data.contactName || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/suppliers");
  revalidatePath("/procurement");

  return { success: true, data: { id } };
}

export async function updateSupplier(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireInventoryAccess();

  const parsed = updateSupplierSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.query.suppliers.findFirst({ where: suppliers.id.eq(parsed.data.id) });
  if (!existing) {
    return { success: false, error: "Supplier not found" };
  }

  await db.update(suppliers).set({
    name: parsed.data.name,
    contactName: parsed.data.contactName || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    updatedAt: nowIso(),
  }).where(suppliers.id.eq(parsed.data.id));

  revalidatePath("/suppliers");

  return { success: true, data: { id: parsed.data.id } };
}

export async function archiveSupplier(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireInventoryAccess();
  if (session.user.role !== "owner") {
    return { success: false, error: "Only the owner can archive suppliers" };
  }

  const existing = await db.query.suppliers.findFirst({ where: suppliers.id.eq(id) });
  if (!existing) {
    return { success: false, error: "Supplier not found" };
  }

  await db.update(suppliers).set({ isActive: 0, updatedAt: nowIso() }).where(suppliers.id.eq(id));

  revalidatePath("/suppliers");

  return { success: true, data: { id } };
}
