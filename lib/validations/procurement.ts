import { z } from "zod";

export const purchaseOrderLineSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPriceNaira: z.number().min(0),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  orderDate: z.string().min(1),
  lines: z.array(purchaseOrderLineSchema).min(1),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.extend({
  id: z.string().min(1),
});

export const receivePurchaseOrderSchema = z.object({
  id: z.string().min(1),
});

export const bulkReceivePurchaseOrdersSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type CreatePurchaseOrder = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseOrderLine = z.infer<typeof purchaseOrderLineSchema>;
