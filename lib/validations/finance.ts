import { z } from "zod";

export const financeDateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  compareFrom: z.string().optional(),
  compareTo: z.string().optional(),
  date: z.string().optional(),
});

export const exportStatementSchema = z.object({
  type: z.enum(["pdf", "excel"]),
  from: z.string().optional(),
  to: z.string().optional(),
  statement: z.enum(["pnl", "balance-sheet", "cash-flow", "expenses"]),
});

export type FinanceDateRangeInput = z.infer<typeof financeDateRangeSchema>;
export type ExportStatementInput = z.infer<typeof exportStatementSchema>;
