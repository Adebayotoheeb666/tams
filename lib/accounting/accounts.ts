/** Chart of accounts codes used in automated journal entries. */
export const ACCOUNT_CODES = {
  CASH: "1000",
  BANK: "1010",
  THRIFT_INVENTORY: "1200",
  NAIL_INVENTORY: "1210",
  THRIFT_REVENUE: "4000",
  NAIL_REVENUE: "4100",
  THRIFT_COGS: "5000",
  NAIL_COGS: "5100",
} as const;

export function paymentAccountCode(
  method: "cash" | "transfer" | "pos" | "credit",
): string {
  return method === "cash" ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK;
}

export function revenueAccountCode(businessUnit: "thrift" | "nails"): string {
  return businessUnit === "thrift"
    ? ACCOUNT_CODES.THRIFT_REVENUE
    : ACCOUNT_CODES.NAIL_REVENUE;
}

export function cogsAccountCode(businessUnit: "thrift" | "nails"): string {
  return businessUnit === "thrift"
    ? ACCOUNT_CODES.THRIFT_COGS
    : ACCOUNT_CODES.NAIL_COGS;
}

export function inventoryAccountCode(businessUnit: "thrift" | "nails"): string {
  return businessUnit === "thrift"
    ? ACCOUNT_CODES.THRIFT_INVENTORY
    : ACCOUNT_CODES.NAIL_INVENTORY;
}
