export function resolveCustomerId(selectedCustomerId?: string | null, manualCustomerId?: string | null) {
  return selectedCustomerId?.trim() || manualCustomerId?.trim() || "";
}
