"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { automationSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AutomationSettingConfig {
  key: string;
  category: string;
  label: string;
  description?: string;
  type: "boolean" | "number" | "text" | "time";
  defaultValue: string;
  minValue?: string;
  maxValue?: string;
  options?: string[];
}

const DEFAULT_SETTINGS: AutomationSettingConfig[] = [
  {
    key: "appointment_reminder_hours_before",
    category: "appointments",
    label: "Appointment reminder (hours before)",
    description: "Send WhatsApp reminder this many hours before the appointment",
    type: "number",
    defaultValue: "24",
    minValue: "1",
    maxValue: "168",
  },
  {
    key: "low_stock_check_enabled",
    category: "inventory",
    label: "Low-stock alerts enabled",
    description: "Send WhatsApp alert when inventory drops below reorder level",
    type: "boolean",
    defaultValue: "1",
  },
  {
    key: "daily_summary_time",
    category: "reporting",
    label: "Daily summary time",
    description: "Time to send daily sales summary (WAT)",
    type: "time",
    defaultValue: "23:00",
  },
  {
    key: "daily_summary_enabled",
    category: "reporting",
    label: "Daily summary enabled",
    description: "Send daily revenue summary to owner",
    type: "boolean",
    defaultValue: "1",
  },
  {
    key: "monthly_statements_enabled",
    category: "reporting",
    label: "Monthly statements enabled",
    description: "Generate and send monthly P&L and Balance Sheet",
    type: "boolean",
    defaultValue: "1",
  },
  {
    key: "whatsapp_notifications_enabled",
    category: "notifications",
    label: "WhatsApp notifications enabled",
    description: "Send all notifications via WhatsApp",
    type: "boolean",
    defaultValue: "1",
  },
  {
    key: "social_media_posting_enabled",
    category: "social",
    label: "Social media auto-posting enabled",
    description: "Automatically post to Instagram, TikTok, YouTube at scheduled times",
    type: "boolean",
    defaultValue: "1",
  },
];

async function ensureSettingsExist() {
  const existing = await db.query.automationSettings.findMany();
  if (existing.length === 0) {
    await db.insert(automationSettings).values(
      DEFAULT_SETTINGS.map((setting) => ({
        id: crypto.randomUUID(),
        key: setting.key,
        category: setting.category,
        label: setting.label,
        description: setting.description || null,
        type: setting.type,
        value: setting.defaultValue,
        defaultValue: setting.defaultValue,
        minValue: setting.minValue || null,
        maxValue: setting.maxValue || null,
        options: setting.options ? JSON.stringify(setting.options) : null,
        enabled: 1,
        updatedAt: new Date().toISOString(),
      }))
    );
  }
}

export async function getAutomationSettings() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return [];
  }

  await ensureSettingsExist();

  const settings = await db.query.automationSettings.findMany({
    orderBy: (settings) => [settings.category, settings.label],
  });

  return settings.map((setting) => ({
    ...setting,
    options: setting.options ? JSON.parse(setting.options) : undefined,
  }));
}

export async function updateAutomationSetting(
  key: string,
  value: string | number | boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const stringValue = String(value);

    const setting = await db.query.automationSettings.findFirst({
      where: eq(automationSettings.key, key),
    });

    if (!setting) {
      return { success: false, error: "Setting not found" };
    }

    // Validate based on type
    if (setting.type === "number") {
      const numValue = Number(stringValue);
      if (isNaN(numValue)) {
        return { success: false, error: "Invalid number" };
      }
      if (setting.minValue && numValue < Number(setting.minValue)) {
        return { success: false, error: `Minimum value is ${setting.minValue}` };
      }
      if (setting.maxValue && numValue > Number(setting.maxValue)) {
        return { success: false, error: `Maximum value is ${setting.maxValue}` };
      }
    }

    if (setting.type === "time") {
      // Validate HH:MM format
      if (!/^\d{2}:\d{2}$/.test(stringValue)) {
        return { success: false, error: "Invalid time format (use HH:MM)" };
      }
    }

    await db
      .update(automationSettings)
      .set({
        value: stringValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(automationSettings.key, key));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update setting",
    };
  }
}

export async function toggleAutomationSetting(
  key: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const setting = await db.query.automationSettings.findFirst({
      where: eq(automationSettings.key, key),
    });

    if (!setting || setting.type !== "boolean") {
      return { success: false, error: "Setting not found or not a boolean" };
    }

    const newValue = setting.value === "1" ? "0" : "1";

    await db
      .update(automationSettings)
      .set({
        value: newValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(automationSettings.key, key));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle setting",
    };
  }
}
