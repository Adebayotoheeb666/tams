"use server";

import { auth } from "@/auth";
import {
  cogsAccountCode,
  inventoryAccountCode,
  paymentAccountCode,
  revenueAccountCode,
} from "@/lib/accounting/accounts";
import { db } from "@/lib/db";
import { triggerClient } from "@/trigger/client";
import {
  accounts,
  journalEntries,
  journalEntryLines,
  orderItems,
  orders,
  products,
  refunds,
  stockMovements,
  type Order,
  type OrderItem,
  type Product,
  type Refund,
} from "@/lib/db/schema";
import { allocateDiscountByUnit, buildReceiptFromOrder } from "@/lib/sales/receipt";
import {
  createSaleSchema,
  salesHistorySchema,
} from "@/lib/validations/sales";
import { nairaToKobo, nowIso, todayDateString, type BusinessUnit } from "@/lib/utils";
import { isPeriodLocked, logAudit } from "@/lib/actions/bookkeeping";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type ResolvedSaleItem = {
  productId: string;
  productName: string;
  businessUnit: BusinessUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
  totalCost: number;
};

async function requireSalesAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role === "accountant") {
    throw new Error("Forbidden");
  }
  return session;
}

async function nextReceiptNumber(tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
  const [{ value }] = await tx
    .select({ value: count() })
    .from(orders);
  return `TBH-${String(Number(value) + 1).padStart(4, "0")}`;
}

async function nextJournalEntryNumber(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
) {
  const [{ value }] = await tx
    .select({ value: count() })
    .from(journalEntries);
  return `JE-${String(Number(value) + 1).padStart(4, "0")}`;
}

async function getAccountMap(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  codes: string[],
) {
  const rows = await tx.query.accounts.findMany({
    where: inArray(accounts.code, codes),
  });

  const map = new Map(rows.map((row) => [row.code, row.id]));
  for (const code of codes) {
    if (!map.has(code)) {
      throw new Error(`Account ${code} not found. Run db:seed.`);
    }
  }
  return map;
}

function assertBalanced(
  lines: Array<{ entryType: "debit" | "credit"; amount: number }>,
) {
  const debits = lines
    .filter((line) => line.entryType === "debit")
    .reduce((sum, line) => sum + line.amount, 0);
  const credits = lines
    .filter((line) => line.entryType === "credit")
    .reduce((sum, line) => sum + line.amount, 0);

  if (debits !== credits) {
    throw new Error(`Unbalanced journal entry: debits ${debits}, credits ${credits}`);
  }
}

export type PosProduct = Pick<
  Product,
  "id" | "sku" | "name" | "businessUnit" | "sellingPrice" | "costPrice" | "quantity"
>;

export async function getPosProducts(): Promise<PosProduct[]> {
  await requireSalesAccess();

  return db.query.products.findMany({
    where: and(eq(products.isActive, 1), sql`${products.quantity} > 0`),
    columns: {
      id: true,
      sku: true,
      name: true,
      businessUnit: true,
      sellingPrice: true,
      costPrice: true,
      quantity: true,
    },
    orderBy: [desc(products.updatedAt)],
  });
}

export async function createSale(
  input: unknown,
): Promise<
  ActionResult<{
    order: Order;
    items: OrderItem[];
    receipt: ReturnType<typeof buildReceiptFromOrder>;
  }>
> {
  const session = await requireSalesAccess();

  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid sale data",
    };
  }

  const { items, paymentMethod, discountNaira, customerId } = parsed.data;
  const discountAmount = nairaToKobo(discountNaira);

  const productIds = items.map((item) => item.productId);
  const dbProducts = await db.query.products.findMany({
    where: and(inArray(products.id, productIds), eq(products.isActive, 1)),
  });

  const productMap = new Map(dbProducts.map((product) => [product.id, product]));
  const resolvedItems: ResolvedSaleItem[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { success: false, error: "One or more products are unavailable" };
    }
    if (product.quantity < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${product.name} (${product.quantity} available)`,
      };
    }

    const totalPrice = product.sellingPrice * item.quantity;
    resolvedItems.push({
      productId: product.id,
      productName: product.name,
      businessUnit: product.businessUnit,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      totalPrice,
      costPrice: product.costPrice,
      totalCost: product.costPrice * item.quantity,
    });
  }

  const subtotal = resolvedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  if (discountAmount > subtotal) {
    return { success: false, error: "Discount cannot exceed subtotal" };
  }

  const totalAmount = subtotal - discountAmount;
  const now = nowIso();
  const entryDate = todayDateString();

  try {
    if (await isPeriodLocked(entryDate)) {
      return { success: false, error: "Accounting period is locked" };
    }

    const result = await db.transaction(async (tx) => {
      const receiptNumber = await nextReceiptNumber(tx);
      const orderId = crypto.randomUUID();

      await tx.insert(orders).values({
        id: orderId,
        receiptNumber,
        customerId: customerId || null,
        orderDate: now,
        subtotal,
        discountAmount,
        totalAmount,
        paymentMethod,
        paymentStatus: "paid",
        amountPaid: totalAmount,
        balanceDue: 0,
        createdBy: session.user.id,
        createdAt: now,
      });

      const insertedItems: OrderItem[] = [];
      for (const item of resolvedItems) {
        const orderItemId = crypto.randomUUID();
        await tx.insert(orderItems).values({
          id: orderItemId,
          orderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
        insertedItems.push({
          id: orderItemId,
          orderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });

        const product = productMap.get(item.productId)!;
        const quantityAfter = product.quantity - item.quantity;

        await tx
          .update(products)
          .set({ quantity: quantityAfter, updatedAt: now })
          .where(eq(products.id, item.productId));

        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(),
          productId: item.productId,
          delta: -item.quantity,
          quantityBefore: product.quantity,
          quantityAfter,
          reason: `Sale ${receiptNumber}`,
          createdBy: session.user.id,
          createdAt: now,
        });

        product.quantity = quantityAfter;
      }

      const accountCodes = new Set<string>([
        paymentAccountCode(paymentMethod),
        revenueAccountCode("thrift"),
        revenueAccountCode("nails"),
        cogsAccountCode("thrift"),
        cogsAccountCode("nails"),
        inventoryAccountCode("thrift"),
        inventoryAccountCode("nails"),
      ]);
      const accountMap = await getAccountMap(tx, Array.from(accountCodes));

      const netRevenueByUnit = allocateDiscountByUnit(
        resolvedItems,
        discountAmount,
      );

      const journalLines: Array<{
        accountId: string;
        entryType: "debit" | "credit";
        amount: number;
        description?: string;
      }> = [];

      journalLines.push({
        accountId: accountMap.get(paymentAccountCode(paymentMethod))!,
        entryType: "debit",
        amount: totalAmount,
        description: `Sale ${receiptNumber}`,
      });

      for (const unit of ["thrift", "nails"] as const) {
        const amount = netRevenueByUnit[unit];
        if (amount > 0) {
          journalLines.push({
            accountId: accountMap.get(revenueAccountCode(unit))!,
            entryType: "credit",
            amount,
            description: `Revenue — ${receiptNumber}`,
          });
        }
      }

      const cogsByUnit: Record<BusinessUnit, number> = { thrift: 0, nails: 0 };
      for (const item of resolvedItems) {
        cogsByUnit[item.businessUnit] += item.totalCost;
      }

      for (const unit of ["thrift", "nails"] as const) {
        const cogsAmount = cogsByUnit[unit];
        if (cogsAmount > 0) {
          journalLines.push({
            accountId: accountMap.get(cogsAccountCode(unit))!,
            entryType: "debit",
            amount: cogsAmount,
            description: `COGS — ${receiptNumber}`,
          });
          journalLines.push({
            accountId: accountMap.get(inventoryAccountCode(unit))!,
            entryType: "credit",
            amount: cogsAmount,
            description: `Inventory — ${receiptNumber}`,
          });
        }
      }

      assertBalanced(journalLines);

      const journalEntryId = crypto.randomUUID();
      await tx.insert(journalEntries).values({
        id: journalEntryId,
        entryNumber: await nextJournalEntryNumber(tx),
        entryDate,
        description: `POS sale ${receiptNumber}`,
        referenceType: "sale",
        referenceId: orderId,
        isReversed: 0,
        createdBy: session.user.id,
        createdAt: now,
      });

      for (const line of journalLines) {
        await tx.insert(journalEntryLines).values({
          id: crypto.randomUUID(),
          journalEntryId,
          accountId: line.accountId,
          entryType: line.entryType,
          amount: line.amount,
          description: line.description,
        });
      }

      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new Error("Failed to create order");
      }

      return { order, items: insertedItems };
    });

    // Trigger low-stock alerts for products that fell below reorder level
    for (const product of dbProducts) {
      const updatedProduct = await db.query.products.findFirst({
        where: eq(products.id, product.id),
      });
      if (updatedProduct && updatedProduct.quantity <= updatedProduct.reorderLevel && product.quantity > product.reorderLevel) {
        try {
          await triggerClient.triggerEvent("inventory.low-stock", {
            productId: product.id,
            productName: product.name,
            currentQuantity: updatedProduct.quantity,
            reorderLevel: updatedProduct.reorderLevel,
          });
        } catch (error) {
          console.error("Failed to trigger low-stock event:", error);
        }
      }
    }

    revalidatePath("/");
    revalidatePath("/sales");
    revalidatePath("/inventory");

    return {
      success: true,
      data: {
        ...result,
        receipt: buildReceiptFromOrder(result.order, result.items),
      },
    };
  } catch (error) {
    // audit failure
    try {
      await logAudit("sale.error", session?.user?.id ?? null, { error: error instanceof Error ? error.message : String(error) });
    } catch {}
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete sale",
    };
  }
}

export async function getOrderById(id: string) {
  await requireSalesAccess();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      createdByUser: { columns: { id: true, name: true } },
      customer: true,
    },
  });

  if (!order) {
    return null;
  }

  return {
    order,
    items: order.items,
    receipt: buildReceiptFromOrder(order, order.items),
  };
}

export async function getSalesHistory(input: unknown = {}) {
  await requireSalesAccess();

  const parsed = salesHistorySchema.safeParse(input);
  const { from, to, page, limit } = parsed.success
    ? parsed.data
    : { from: undefined, to: undefined, page: 1, limit: 20 };

  const conditions = [];
  if (from) {
    conditions.push(gte(orders.orderDate, from));
  }
  if (to) {
    conditions.push(lte(orders.orderDate, `${to}T23:59:59.999Z`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * limit;

  const [rows, totalResult] = await Promise.all([
    db.query.orders.findMany({
      where: whereClause,
      with: {
        items: true,
        createdByUser: { columns: { name: true } },
      },
      orderBy: [desc(orders.orderDate)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(orders).where(whereClause),
  ]);

  return {
    orders: rows,
    total: totalResult[0]?.value ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalResult[0]?.value ?? 0) / limit),
  };
}

export async function processRefund(input: {
  orderId: string;
  refundAmount: number;
  reason: string;
  refundMethod: "cash" | "transfer" | "credit";
}): Promise<ActionResult<Refund>> {
  const session = await requireSalesAccess();

  const { orderId, refundAmount, reason, refundMethod } = input;

  if (refundAmount <= 0) {
    return { success: false, error: "Refund amount must be greater than 0" };
  }

  try {
    if (await isPeriodLocked(todayDateString())) {
      return { success: false, error: "Accounting period is locked" };
    }

    const result = await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { items: true },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (refundAmount > order.totalAmount) {
        throw new Error(
          `Refund amount cannot exceed order total (${order.totalAmount / 100})`,
        );
      }

      const now = nowIso();
      const entryDate = todayDateString();

      const [{ value: refundCount }] = await tx
        .select({ value: count() })
        .from(refunds);
      const refundNumber = `REF-${String(Number(refundCount) + 1).padStart(4, "0")}`;

      const refundId = crypto.randomUUID();
      await tx.insert(refunds).values({
        id: refundId,
        orderId,
        refundNumber,
        reason,
        refundAmount,
        refundMethod,
        status: "processed",
        createdBy: session.user.id,
        createdAt: now,
      });

      const isFullRefund = refundAmount === order.totalAmount;

        if (isFullRefund) {
          await tx
            .update(orders)
            .set({
              paymentStatus: "partial",
              amountPaid: order.amountPaid - refundAmount,
              balanceDue: (order.balanceDue || 0) + refundAmount,
            })
            .where(eq(orders.id, orderId));

          const items = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, orderId),
          });

          for (const item of items) {
            const product = await tx.query.products.findFirst({
              where: eq(products.id, item.productId),
            });

            if (!product) continue;

            const quantityAfter = product.quantity + item.quantity;
            await tx
              .update(products)
              .set({ quantity: quantityAfter, updatedAt: now })
              .where(eq(products.id, item.productId));

            await tx.insert(stockMovements).values({
              id: crypto.randomUUID(),
              productId: item.productId,
              delta: item.quantity,
              quantityBefore: product.quantity,
              quantityAfter,
              reason: `Refund ${refundNumber}`,
              createdBy: session.user.id,
              createdAt: now,
            });
          }
        } else {
        const newAmountPaid = order.amountPaid - refundAmount;
        const newBalanceDue = order.balanceDue + refundAmount;

        await tx
          .update(orders)
          .set({
            paymentStatus:
              newAmountPaid === 0 ? "unpaid" : "partial",
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
          })
          .where(eq(orders.id, orderId));
      }

      const accountCodes = new Set<string>([
        paymentAccountCode(refundMethod),
        revenueAccountCode("thrift"),
        revenueAccountCode("nails"),
      ]);
      const accountMap = await getAccountMap(tx, Array.from(accountCodes));

      const journalEntryId = crypto.randomUUID();
      await tx.insert(journalEntries).values({
        id: journalEntryId,
        entryNumber: await nextJournalEntryNumber(tx),
        entryDate,
        description: `Refund ${refundNumber} for ${order.receiptNumber}`,
        referenceType: "sale",
        referenceId: orderId,
        isReversed: 0,
        createdBy: session.user.id,
        createdAt: now,
      });

      const journalLines: Array<{
        accountId: string;
        entryType: "debit" | "credit";
        amount: number;
        description?: string;
      }> = [
        {
          accountId: accountMap.get(revenueAccountCode("thrift"))!,
          entryType: "debit",
          amount: refundAmount,
          description: `Refund reversal — ${refundNumber}`,
        },
        {
          accountId: accountMap.get(paymentAccountCode(refundMethod))!,
          entryType: "credit",
          amount: refundAmount,
          description: `Refund payment — ${refundNumber}`,
        },
      ];

      assertBalanced(journalLines);

      for (const line of journalLines) {
        await tx.insert(journalEntryLines).values({
          id: crypto.randomUUID(),
          journalEntryId,
          accountId: line.accountId,
          entryType: line.entryType,
          amount: line.amount,
          description: line.description,
        });
      }

      return await tx.query.refunds.findFirst({
        where: eq(refunds.id, refundId),
      });
    });

    revalidatePath("/");
    revalidatePath("/sales");
    revalidatePath("/inventory");

    if (!result) {
      return { success: false, error: "Failed to process refund" };
    }

    return { success: true, data: result };
  } catch (error) {
    try {
      await logAudit("refund.error", session?.user?.id ?? null, {
        error: error instanceof Error ? error.message : String(error),
      });
    } catch {}
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process refund",
    };
  }
}

export async function getRefundsByOrderId(orderId: string) {
  await requireSalesAccess();

  return db.query.refunds.findMany({
    where: eq(refunds.orderId, orderId),
    with: { createdByUser: { columns: { name: true } } },
    orderBy: [desc(refunds.createdAt)],
  });
}

export async function recordPartialPayment(input: {
  orderId: string;
  amountPaid: number;
  paymentMethod: "cash" | "transfer" | "pos";
}): Promise<ActionResult<Order>> {
  const session = await requireSalesAccess();
  const { orderId, amountPaid, paymentMethod } = input;

  if (amountPaid <= 0) {
    return { success: false, error: "Payment amount must be greater than 0" };
  }

  try {
    const entryDate = todayDateString();
    if (await isPeriodLocked(entryDate)) {
      return { success: false, error: "Accounting period is locked" };
    }

    const result = await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const balanceDue = order.balanceDue || 0;
      if (amountPaid > balanceDue) {
        throw new Error(
          `Payment amount cannot exceed balance due (${balanceDue / 100})`,
        );
      }

      const now = nowIso();
      const newAmountPaid = order.amountPaid + amountPaid;
      const newBalanceDue = balanceDue - amountPaid;

      const newPaymentStatus =
        newBalanceDue === 0
          ? "paid"
          : newAmountPaid === 0
            ? "unpaid"
            : "partial";

      await tx
        .update(orders)
        .set({
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          paymentStatus: newPaymentStatus,
        });

      const accountCodes = new Set<string>([
        paymentAccountCode(paymentMethod),
        revenueAccountCode("thrift"),
        revenueAccountCode("nails"),
      ]);
      const accountMap = await getAccountMap(tx, Array.from(accountCodes));

      const journalEntryId = crypto.randomUUID();
      await tx.insert(journalEntries).values({
        id: journalEntryId,
        entryNumber: await nextJournalEntryNumber(tx),
        entryDate,
        description: `Partial payment for ${order.receiptNumber}`,
        referenceType: "sale",
        referenceId: orderId,
        isReversed: 0,
        createdBy: session.user.id,
        createdAt: now,
      });

      const journalLines: Array<{
        accountId: string;
        entryType: "debit" | "credit";
        amount: number;
        description?: string;
      }> = [
        {
          accountId: accountMap.get(paymentAccountCode(paymentMethod))!,
          entryType: "debit",
          amount: amountPaid,
          description: `Payment — ${order.receiptNumber}`,
        },
        {
          accountId: accountMap.get(revenueAccountCode("thrift"))!,
          entryType: "credit",
          amount: amountPaid,
          description: `Payment received — ${order.receiptNumber}`,
        },
      ];

      assertBalanced(journalLines);

      for (const line of journalLines) {
        await tx.insert(journalEntryLines).values({
          id: crypto.randomUUID(),
          journalEntryId,
          accountId: line.accountId,
          entryType: line.entryType,
          amount: line.amount,
          description: line.description,
        });
      }

      return await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });
    });

    revalidatePath("/");
    revalidatePath("/sales");

    if (!result) {
      return { success: false, error: "Failed to record payment" };
    }

    return { success: true, data: result };
  } catch (error) {
    try {
      await logAudit("payment.error", session?.user?.id ?? null, {
        error: error instanceof Error ? error.message : String(error),
      });
    } catch {}
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record payment",
    };
  }
}
