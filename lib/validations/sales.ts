import { z } from "zod";

export const paymentMethodSchema = z.enum(["cash", "transfer", "pos"]);

export const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
  paymentMethod: paymentMethodSchema,
  discountNaira: z.coerce.number().min(0).default(0),
  customerId: z.string().uuid().optional().nullable(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const salesHistorySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
