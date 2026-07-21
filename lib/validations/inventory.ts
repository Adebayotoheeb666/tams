import { z } from "zod";

export const businessUnitSchema = z.enum(["thrift", "nails"]);

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(50),
  categoryId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  businessUnit: businessUnitSchema,
  description: z.string().max(1000).optional(),
  costPriceNaira: z.coerce.number().min(0, "Cost must be 0 or more"),
  sellingPriceNaira: z.coerce.number().min(0, "Price must be 0 or more"),
  quantity: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(3),
  imageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export const updateProductSchema = createProductSchema
  .omit({ quantity: true })
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  delta: z.coerce.number().int().refine((v) => v !== 0, "Adjustment cannot be zero"),
  reason: z.string().min(1, "Reason is required").max(500),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  businessUnit: businessUnitSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
