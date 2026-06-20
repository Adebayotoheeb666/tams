"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { purchaseOrders, purchaseOrderLines, products, stockMovements } from "@/lib/db/schema";
import {
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
  updatePurchaseOrderSchema,
  bulkReceivePurchaseOrdersSchema,
} from "@/lib/validations/procurement";
import { nowIso, nairaToKobo } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireProcurementAccess() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role === "accountant") throw new Error("Forbidden");
  return session;
}

export async function getPurchaseOrders() {
  await requireProcurementAccess();
  return db.query.purchaseOrders.findMany({ with: { supplier: true }, orderBy: [purchaseOrders.createdAt.desc()] });
}

export async function getPurchaseOrderById(id: string) {
  await requireProcurementAccess();
  return db.query.purchaseOrders.findFirst({ where: purchaseOrders.id.eq(id), with: { lines: true, supplier: true } }) ?? null;
}

export async function createPurchaseOrder(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireProcurementAccess();

  const parsed = createPurchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const now = nowIso();
  const id = crypto.randomUUID();

  const total = parsed.data.lines.reduce((s, l) => s + Math.round(l.unitPriceNaira * 100) * l.quantity, 0);

  await db.transaction(async (tx) => {
    await tx.insert(purchaseOrders).values({
      id,
      orderNumber: `PO-${Date.now()}`,
      supplierId: parsed.data.supplierId,
      orderDate: parsed.data.orderDate,
      totalAmount: total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    for (const line of parsed.data.lines) {
      await tx.insert(purchaseOrderLines).values({
        id: crypto.randomUUID(),
        purchaseOrderId: id,
        productId: line.productId || null,
        productName: line.productName,
        quantity: line.quantity,
        unitPrice: Math.round(line.unitPriceNaira * 100),
        totalPrice: Math.round(line.unitPriceNaira * 100) * line.quantity,
      });
    }
  });

  revalidatePath("/procurement");
  return { success: true, data: { id } };
}

export async function receivePurchaseOrder(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireProcurementAccess();

  const parsed = receivePurchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const po = await db.query.purchaseOrders.findFirst({ where: purchaseOrders.id.eq(parsed.data.id), with: { lines: true } });
  if (!po) return { success: false, error: "Purchase order not found" };
  if (po.status === "received") return { success: false, error: "Already received" };

  const now = nowIso();
  const { isPeriodLocked } = await import("@/lib/actions/bookkeeping");
  if (await isPeriodLocked(now)) {
    return { success: false, error: "Accounting period is locked" };
  }
  const session = await auth();
  const userId = session?.user?.id ?? "";

  await db.transaction(async (tx) => {
    await tx.update(purchaseOrders).set({ status: "received", updatedAt: now }).where(purchaseOrders.id.eq(po.id));

    for (const line of po.lines) {
      if (!line.productId) continue;
      const product = await tx.query.products.findFirst({ where: products.id.eq(line.productId) });
      const before = product ? product.quantity : 0;
      const after = before + line.quantity;

      await tx.update(products).set({ quantity: after, updatedAt: now }).where(products.id.eq(line.productId));

      await tx.insert(stockMovements).values({
        id: crypto.randomUUID(),
        productId: line.productId,
        delta: line.quantity,
        quantityBefore: before,
        quantityAfter: after,
        reason: `Purchase order ${po.orderNumber}`,
        createdBy: userId,
        createdAt: now,
      });
    }
  });

  revalidatePath("/procurement");
  revalidatePath("/inventory");

  return { success: true, data: { id: po.id } };
}

export async function updatePurchaseOrder(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireProcurementAccess();

  const parsed = updatePurchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const po = await db.query.purchaseOrders.findFirst({ where: purchaseOrders.id.eq(parsed.data.id), with: { lines: true } });
  if (!po) return { success: false, error: "Purchase order not found" };
  if (po.status !== "pending") return { success: false, error: "Only pending orders can be updated" };

  const now = nowIso();
  const total = parsed.data.lines.reduce((s, l) => s + nairaToKobo(l.unitPriceNaira) * l.quantity, 0);

  await db.transaction(async (tx) => {
    await tx.update(purchaseOrders).set({
      supplierId: parsed.data.supplierId,
      orderDate: parsed.data.orderDate,
      totalAmount: total,
      updatedAt: now,
    }).where(purchaseOrders.id.eq(parsed.data.id));

    await tx.delete(purchaseOrderLines).where(purchaseOrderLines.purchaseOrderId.eq(parsed.data.id));

    for (const line of parsed.data.lines) {
      await tx.insert(purchaseOrderLines).values({
        id: crypto.randomUUID(),
        purchaseOrderId: parsed.data.id,
        productId: line.productId || null,
        productName: line.productName,
        quantity: line.quantity,
        unitPrice: nairaToKobo(line.unitPriceNaira),
        totalPrice: nairaToKobo(line.unitPriceNaira) * line.quantity,
      });
    }
  });

  revalidatePath("/procurement");

  return { success: true, data: { id: parsed.data.id } };
}

export async function cancelPurchaseOrder(id: string): Promise<ActionResult<{ id: string }>> {
  await requireProcurementAccess();

  const po = await db.query.purchaseOrders.findFirst({ where: purchaseOrders.id.eq(id) });
  if (!po) return { success: false, error: "Purchase order not found" };
  if (po.status === "received") return { success: false, error: "Cannot cancel a received order" };
  if (po.status === "cancelled") return { success: false, error: "Purchase order is already cancelled" };

  await db.update(purchaseOrders).set({ status: "cancelled", updatedAt: nowIso() }).where(purchaseOrders.id.eq(id));
  revalidatePath("/procurement");

  return { success: true, data: { id } };
}

export async function bulkReceivePurchaseOrders(input: unknown): Promise<ActionResult<{ ids: string[] }>> {
  await requireProcurementAccess();

  const parsed = bulkReceivePurchaseOrdersSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const now = nowIso();
  const { isPeriodLocked } = await import("@/lib/actions/bookkeeping");
  if (await isPeriodLocked(now)) {
    return { success: false, error: "Accounting period is locked" };
  }
  const rawOrders = await db.query.purchaseOrders.findMany({
    where: purchaseOrders.id.in(parsed.data.ids),
    with: { lines: true },
  });

  const pendingOrders = rawOrders.filter((order) => order.status === "pending");
  if (pendingOrders.length === 0) return { success: false, error: "No pending purchase orders selected" };

  const session = await auth();
  const userId = session?.user?.id ?? "";

  await db.transaction(async (tx) => {
    for (const po of pendingOrders) {
      await tx.update(purchaseOrders).set({ status: "received", updatedAt: now }).where(purchaseOrders.id.eq(po.id));

      for (const line of po.lines) {
        if (!line.productId) continue;
        const product = await tx.query.products.findFirst({ where: products.id.eq(line.productId) });
        const before = product ? product.quantity : 0;
        const after = before + line.quantity;

        await tx.update(products).set({ quantity: after, updatedAt: now }).where(products.id.eq(line.productId));

        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(),
          productId: line.productId,
          delta: line.quantity,
          quantityBefore: before,
          quantityAfter: after,
          reason: `Bulk receive purchase orders (${po.orderNumber})`,
          createdBy: userId,
          createdAt: now,
        });
      }
    }
  });

  revalidatePath("/procurement");
  revalidatePath("/inventory");

  return { success: true, data: { ids: pendingOrders.map((order) => order.id) } };
}
