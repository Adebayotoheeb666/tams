import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format kobo (integer) as Nigerian Naira for display. */
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convert naira (decimal) to kobo integer for storage. */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** Convert kobo integer to naira for form inputs. */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function isLowStock(quantity: number, reorderLevel: number): boolean {
  return quantity <= reorderLevel;
}

export type BusinessUnit = "thrift" | "nails";

export function businessUnitLabel(unit: BusinessUnit): string {
  return unit === "thrift" ? "Tams Thrift" : "Glitz Nails";
}

/** Add minutes to HH:MM time string. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = (hours ?? 0) * 60 + (mins ?? 0) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatAppointmentStatus(
  status: string,
): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
