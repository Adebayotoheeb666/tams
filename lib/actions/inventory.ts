"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  categories,
  products,
  stockMovements,
  type Product,
} from "@/lib/db/schema";
import { triggerClient } from "@/trigger/client";
import {
  adjustStockSchema,
  createCategorySchema,
  createProductSchema,
  updateProductSchema,
} from "@/lib/validations/inventory";
import { parseProductsCsv } from "@/lib/inventory/csv";
import { nairaToKobo, nowIso } from "@/lib/utils";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { forwardToN8nWebhook } from "@/lib/integrations/n8n";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireInventoryAccess() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  if (session.user.role === "accountant") {
    return null;
  }
  return session;
}

export async function getCategories(businessUnit?: "thrift" | "nails") {
  const session = await requireInventoryAccess();
  if (!session) {
    return [];
  }

  const conditions = businessUnit
    ? eq(categories.businessUnit, businessUnit)
    : undefined;

  return db.query.categories.findMany({
    where: conditions,
    orderBy: [asc(categories.businessUnit), asc(categories.name)],
  });
}

export async function createCategory(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireInventoryAccess();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, businessUnit } = parsed.data;
  const existing = await db.query.categories.findFirst({
    where: and(
      eq(categories.name, name),
      eq(categories.businessUnit, businessUnit),
    ),
  });

  if (existing) {
    return { success: false, error: "Category already exists for this business unit" };
  }

  const id = crypto.randomUUID();
  await db.insert(categories).values({
    id,
    name,
    businessUnit,
    createdAt: nowIso(),
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/categories");
  return { success: true, data: { id } };
}

export type ProductListFilters = {
  businessUnit?: "thrift" | "nails" | "all";
  search?: string;
  lowStockOnly?: boolean;
};

export type ProductWithCategory = Product & {
  category: { id: string; name: string } | null;
};

export async function getProducts(
  filters: ProductListFilters = {},
): Promise<ProductWithCategory[]> {
  const session = await requireInventoryAccess();
  if (!session) {
    return [];
  }

  const { businessUnit = "all", search, lowStockOnly } = filters;
  const conditions = [eq(products.isActive, 1)];

  if (businessUnit !== "all") {
    conditions.push(eq(products.businessUnit, businessUnit));
  }

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(like(products.name, term), like(products.sku, term))!,
    );
  }

  if (lowStockOnly) {
    conditions.push(sql`${products.quantity} <= ${products.reorderLevel}`);
  }

  const rows = await db.query.products.findMany({
    where: and(...conditions),
    with: { category: true },
    orderBy: [desc(products.updatedAt)],
  });

  return rows.map((row) => ({
    ...row,
    category: row.category
      ? { id: row.category.id, name: row.category.name }
      : null,
  }));
}

export async function getProductById(id: string) {
  const session = await requireInventoryAccess();
  if (!session) {
    return null;
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: true,
      stockMovements: {
        with: { createdByUser: { columns: { id: true, name: true } } },
        orderBy: [desc(stockMovements.createdAt)],
        limit: 20,
      },
    },
  });

  return product ?? null;
}

export async function getLowStockProducts(): Promise<ProductWithCategory[]> {
  return getProducts({ lowStockOnly: true });
}

export async function createProduct(
  input: unknown,
): Promise<ActionResult<Product>> {
  const session = await requireInventoryAccess();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const existingSku = await db.query.products.findFirst({
    where: eq(products.sku, data.sku),
  });

  if (existingSku) {
    return { success: false, error: "SKU already exists" };
  }

  const now = nowIso();
  const productId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(products).values({
      id: productId,
      sku: data.sku,
      name: data.name,
      categoryId: data.categoryId || null,
      businessUnit: data.businessUnit,
      description: data.description || null,
      costPrice: nairaToKobo(data.costPriceNaira),
      sellingPrice: nairaToKobo(data.sellingPriceNaira),
      quantity: data.quantity,
      reorderLevel: data.reorderLevel,
      imageUrl: data.imageUrl || null,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    if (data.quantity > 0) {
      await tx.insert(stockMovements).values({
        id: crypto.randomUUID(),
        productId,
        delta: data.quantity,
        quantityBefore: 0,
        quantityAfter: data.quantity,
        reason: "Initial stock",
        createdBy: session.user.id,
        createdAt: now,
      });
    }
  });

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  revalidatePath("/inventory");
  revalidatePath("/");

  if (!product) {
    return { success: false, error: "Failed to create product" };
  }

  return { success: true, data: product };
}

export async function updateProduct(
  input: unknown,
): Promise<ActionResult<Product>> {
  const session = await requireInventoryAccess();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, ...fields } = parsed.data;
  const existing = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!existing) {
    return { success: false, error: "Product not found" };
  }

  if (fields.sku && fields.sku !== existing.sku) {
    const skuTaken = await db.query.products.findFirst({
      where: eq(products.sku, fields.sku),
    });
    if (skuTaken) {
      return { success: false, error: "SKU already exists" };
    }
  }

  const updates: Partial<typeof products.$inferInsert> = {
    updatedAt: nowIso(),
  };

  if (fields.name !== undefined) updates.name = fields.name;
  if (fields.sku !== undefined) updates.sku = fields.sku;
  if (fields.categoryId !== undefined) updates.categoryId = fields.categoryId || null;
  if (fields.businessUnit !== undefined) updates.businessUnit = fields.businessUnit;
  if (fields.description !== undefined) updates.description = fields.description || null;
  if (fields.costPriceNaira !== undefined) {
    updates.costPrice = nairaToKobo(fields.costPriceNaira);
  }
  if (fields.sellingPriceNaira !== undefined) {
    updates.sellingPrice = nairaToKobo(fields.sellingPriceNaira);
  }
  if (fields.reorderLevel !== undefined) updates.reorderLevel = fields.reorderLevel;
  if (fields.imageUrl !== undefined) updates.imageUrl = fields.imageUrl || null;

  await db.update(products).set(updates).where(eq(products.id, id));

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/");

  if (!product) {
    return { success: false, error: "Failed to update product" };
  }

  return { success: true, data: product };
}

export async function archiveProduct(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireInventoryAccess();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }
  if (session.user.role !== "owner") {
    return { success: false, error: "Only the owner can archive products" };
  }

  const existing = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!existing) {
    return { success: false, error: "Product not found" };
  }

  await db
    .update(products)
    .set({ isActive: 0, updatedAt: nowIso() })
    .where(eq(products.id, id));

  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true, data: { id } };
}

export async function adjustStock(
  input: unknown,
): Promise<ActionResult<Product>> {
  const session = await requireInventoryAccess();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  // period lock check
  const { isPeriodLocked } = await import("@/lib/actions/bookkeeping");

  const parsed = adjustStockSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { productId, delta, reason } = parsed.data;

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product || !product.isActive) {
    return { success: false, error: "Product not found" };
  }

  const quantityAfter = product.quantity + delta;
  if (quantityAfter < 0) {
    return {
      success: false,
      error: `Cannot reduce stock below zero (current: ${product.quantity})`,
    };
  }

  const now = nowIso();
  if (await isPeriodLocked(now)) {
    return { success: false, error: "Accounting period is locked" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({ quantity: quantityAfter, updatedAt: now })
      .where(eq(products.id, productId));

    await tx.insert(stockMovements).values({
      id: crypto.randomUUID(),
      productId,
      delta,
      quantityBefore: product.quantity,
      quantityAfter,
      reason,
      createdBy: session.user.id,
      createdAt: now,
    });
  });

  const updated = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  // Trigger low-stock alert if product fell below reorder level
  if (updated && updated.quantity <= updated.reorderLevel && product.quantity > product.reorderLevel) {
    try {
      const { TRIGGER_EVENTS } = await import("@/trigger/client");
      await triggerClient.triggerEvent(TRIGGER_EVENTS.INVENTORY_ALERTS_LOW_STOCK, {
        productId: updated.id,
        productName: updated.name,
        currentQuantity: updated.quantity,
        reorderLevel: updated.reorderLevel,
      });
    } catch (error) {
      console.error("Failed to trigger low-stock event:", error);
    }

    try {
      await forwardToN8nWebhook(process.env.N8N_LOW_STOCK_PATH ?? "/webhook/low-stock", {
        event: "inventory.low-stock",
        product: {
          id: updated.id,
          name: updated.name,
          sku: updated.sku,
          quantity: updated.quantity,
          reorderLevel: updated.reorderLevel,
          businessUnit: updated.businessUnit,
        },
      });
    } catch (error) {
      console.error("Failed to forward low-stock event to n8n:", error);
    }
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
  revalidatePath("/");

  if (!updated) {
    return { success: false, error: "Failed to adjust stock" };
  }

  return { success: true, data: updated };
}

export type CsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; sku?: string; message: string }>;
};

export async function importProductsFromCsv(
  csvText: string,
): Promise<ActionResult<CsvImportResult>> {
  const session = await requireInventoryAccess();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }
  if (session.user.role !== "owner") {
    return { success: false, error: "Only the owner can import products from CSV" };
  }

  const { isPeriodLocked } = await import("@/lib/actions/bookkeeping");
  // block import if current period locked
  if (await isPeriodLocked(nowIso())) {
    return { success: false, error: "Accounting period is locked" };
  }

  const { rows, errors: parseErrors } = parseProductsCsv(csvText);

  const result: CsvImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: parseErrors.map((error) => ({
      row: error.row,
      message: error.message,
    })),
  };

  if (rows.length === 0 && result.errors.length > 0) {
    return { success: false, error: result.errors[0]?.message ?? "Invalid CSV" };
  }

  const allCategories = await db.query.categories.findMany();
  const categoryLookup = new Map(
    allCategories.map((category) => [
      `${category.businessUnit}:${category.name.toLowerCase()}`,
      category.id,
    ]),
  );

  for (const { rowNumber, data } of rows) {
    try {
      const categoryId = data.category
        ? categoryLookup.get(
            `${data.businessUnit}:${data.category.toLowerCase()}`,
          ) ?? null
        : null;

      if (data.category && !categoryId) {
        result.errors.push({
          row: rowNumber,
          sku: data.sku,
          message: `Category "${data.category}" not found for ${data.businessUnit}`,
        });
        result.skipped++;
        continue;
      }

      const existing = await db.query.products.findFirst({
        where: eq(products.sku, data.sku),
      });

      const now = nowIso();

      if (!existing) {
        const productId = crypto.randomUUID();
        await db.transaction(async (tx) => {
          await tx.insert(products).values({
            id: productId,
            sku: data.sku,
            name: data.name,
            categoryId,
            businessUnit: data.businessUnit,
            description: data.description || null,
            costPrice: nairaToKobo(data.costPriceNaira),
            sellingPrice: nairaToKobo(data.sellingPriceNaira),
            quantity: data.quantity,
            reorderLevel: data.reorderLevel,
            isActive: 1,
            createdAt: now,
            updatedAt: now,
          });

          if (data.quantity > 0) {
            await tx.insert(stockMovements).values({
              id: crypto.randomUUID(),
              productId,
              delta: data.quantity,
              quantityBefore: 0,
              quantityAfter: data.quantity,
              reason: "CSV import — opening stock",
              createdBy: session.user.id,
              createdAt: now,
            });
          }
        });
        result.created++;
        continue;
      }

      if (!existing.isActive) {
        result.errors.push({
          row: rowNumber,
          sku: data.sku,
          message: "SKU belongs to an archived product",
        });
        result.skipped++;
        continue;
      }

      await db
        .update(products)
        .set({
          name: data.name,
          categoryId,
          businessUnit: data.businessUnit,
          description: data.description || null,
          costPrice: nairaToKobo(data.costPriceNaira),
          sellingPrice: nairaToKobo(data.sellingPriceNaira),
          reorderLevel: data.reorderLevel,
          updatedAt: now,
        })
        .where(eq(products.id, existing.id));

      const stockDelta = data.quantity - existing.quantity;
      if (stockDelta !== 0) {
        await db.transaction(async (tx) => {
          await tx
            .update(products)
            .set({ quantity: data.quantity, updatedAt: now })
            .where(eq(products.id, existing.id));

          await tx.insert(stockMovements).values({
            id: crypto.randomUUID(),
            productId: existing.id,
            delta: stockDelta,
            quantityBefore: existing.quantity,
            quantityAfter: data.quantity,
            reason: "CSV import — stock sync",
            createdBy: session.user.id,
            createdAt: now,
          });
        });
      }

      result.updated++;
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        sku: data.sku,
        message: error instanceof Error ? error.message : "Import failed",
      });
      result.skipped++;
    }
  }

  revalidatePath("/inventory");
  revalidatePath("/sales/new");
  revalidatePath("/");

  return { success: true, data: result };
}
