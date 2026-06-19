import { businessUnitSchema } from "@/lib/validations/inventory";
import { z } from "zod";

export const csvProductRowSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  businessUnit: businessUnitSchema,
  category: z.string().max(100).optional(),
  costPriceNaira: z.coerce.number().min(0, "Cost must be 0 or more"),
  sellingPriceNaira: z.coerce.number().min(0, "Price must be 0 or more"),
  quantity: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0).default(3),
  description: z.string().max(1000).optional(),
});

export type CsvProductRow = z.infer<typeof csvProductRowSchema>;

const HEADER_ALIASES: Record<string, keyof CsvProductRow | "businessUnit"> = {
  sku: "sku",
  name: "name",
  product_name: "name",
  business_unit: "businessUnit",
  businessunit: "businessUnit",
  unit: "businessUnit",
  category: "category",
  category_name: "category",
  cost_price_naira: "costPriceNaira",
  cost_price: "costPriceNaira",
  cost: "costPriceNaira",
  selling_price_naira: "sellingPriceNaira",
  selling_price: "sellingPriceNaira",
  price: "sellingPriceNaira",
  quantity: "quantity",
  qty: "quantity",
  stock: "quantity",
  reorder_level: "reorderLevel",
  reorder: "reorderLevel",
  description: "description",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseProductsCsv(csvText: string): {
  rows: Array<{ rowNumber: number; data: CsvProductRow }>;
  errors: Array<{ row: number; message: string }>;
} {
  const normalized = csvText.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    return { rows: [], errors: [{ row: 0, message: "CSV file is empty" }] };
  }

  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 0, message: "CSV must include a header row and at least one data row" }],
    };
  }

  const headerCells = parseCsvLine(lines[0]!);
  const columnMap = headerCells.map((header) => {
    const key = normalizeHeader(header);
    return HEADER_ALIASES[key] ?? null;
  });

  if (!columnMap.includes("sku") || !columnMap.includes("name")) {
    return {
      rows: [],
      errors: [{ row: 1, message: "CSV header must include sku and name columns" }],
    };
  }

  const rows: Array<{ rowNumber: number; data: CsvProductRow }> = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cells = parseCsvLine(lines[i]!);
    const record: Record<string, string> = {};

    columnMap.forEach((field, index) => {
      if (!field) return;
      const value = cells[index] ?? "";
      if (value !== "") {
        record[field] = value;
      }
    });

    if (record.businessUnit) {
      record.businessUnit = record.businessUnit.toLowerCase();
    }

    const parsed = csvProductRowSchema.safeParse(record);
    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }

    rows.push({ rowNumber, data: parsed.data });
  }

  return { rows, errors };
}

export const CSV_IMPORT_TEMPLATE = `sku,name,business_unit,category,cost_price_naira,selling_price_naira,quantity,reorder_level,description
TT-001,Corporate Shirt White,thrift,Corporate Shirts,1500,3500,10,3,White corporate shirt size M
GN-001,Press-On Set Rose Gold,nails,Press-On Nails,800,2500,5,2,Fancy press-on nail set
`.trim();
