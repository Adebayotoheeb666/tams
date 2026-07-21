"use server";

import { exportStatement } from "@/lib/actions/finance";

export async function exportPnlPdf(formData: FormData) {
  await exportStatement({
    type: "pdf",
    from: formData.get("from")?.toString() || undefined,
    to: formData.get("to")?.toString() || undefined,
    statement: "pnl",
  });
}

export async function exportPnlExcel(formData: FormData) {
  await exportStatement({
    type: "excel",
    from: formData.get("from")?.toString() || undefined,
    to: formData.get("to")?.toString() || undefined,
    statement: "pnl",
  });
}

export async function exportExpensesPdf(formData: FormData) {
  await exportStatement({
    type: "pdf",
    from: formData.get("from")?.toString() || undefined,
    to: formData.get("to")?.toString() || undefined,
    statement: "expenses",
  });
}

export async function exportExpensesExcel(formData: FormData) {
  await exportStatement({
    type: "excel",
    from: formData.get("from")?.toString() || undefined,
    to: formData.get("to")?.toString() || undefined,
    statement: "expenses",
  });
}

export async function exportBalanceSheetPdf(formData: FormData) {
  await exportStatement({
    type: "pdf",
    from: formData.get("date")?.toString() || undefined,
    to: formData.get("date")?.toString() || undefined,
    statement: "balance-sheet",
  });
}

export async function exportBalanceSheetExcel(formData: FormData) {
  await exportStatement({
    type: "excel",
    from: formData.get("date")?.toString() || undefined,
    to: formData.get("date")?.toString() || undefined,
    statement: "balance-sheet",
  });
}

export async function exportCashFlowPdf(formData: FormData) {
  await exportStatement({
    type: "pdf",
    from: formData.get("from")?.toString() || undefined,
    to: formData.get("to")?.toString() || undefined,
    statement: "cash-flow",
  });
}

export async function exportCashFlowExcel(formData: FormData) {
  await exportStatement({
    type: "excel",
    from: formData.get("from")?.toString() || undefined,
    to: formData.get("to")?.toString() || undefined,
    statement: "cash-flow",
  });
}
