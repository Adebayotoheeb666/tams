export function normalizeAutomationSettingValue(
  value: FormDataEntryValue | string | number | boolean | null | undefined,
  type: "boolean" | "number" | "text" | "time"
) {
  if (value instanceof File) {
    return "";
  }

  const normalizedValue = typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);

  if (type === "boolean") {
    return normalizedValue === "on" || normalizedValue === "1" || normalizedValue === "true" || normalizedValue === "yes" ? "1" : "0";
  }

  if (type === "number") {
    const numberValue = Number(normalizedValue);
    return Number.isFinite(numberValue) ? String(numberValue) : "0";
  }

  return normalizedValue;
}
