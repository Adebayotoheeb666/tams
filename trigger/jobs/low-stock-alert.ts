import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { lte } from "drizzle-orm";

function getN8nUrl(path: string) {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("N8N_WEBHOOK_BASE_URL is not configured");
  }
  return `${baseUrl}${path}`;
}

async function postWebhook(path: string, body: unknown) {
  const url = getN8nUrl(path);
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SECRET ? { "x-n8n-webhook-secret": process.env.N8N_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function lowStockAlertJob() {
  const lowStockProducts = await db.query.products.findMany({
    where: lte(products.quantity, products.reorderLevel),
  });

  if (lowStockProducts.length === 0) {
    return;
  }

  await postWebhook(process.env.N8N_LOW_STOCK_PATH ?? "/webhook/low-stock", {
    products: lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
      sku: product.sku,
      businessUnit: product.businessUnit,
    })),
  });
}
