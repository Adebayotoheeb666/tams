"use client";

import { useState, useTransition } from "react";
import { updateAutomationSetting, toggleAutomationSetting } from "@/lib/actions/automation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutomationSetting } from "@/lib/db/schema";
import { toast } from "sonner";

interface AutomationManagerProps {
  initialSettings: AutomationSetting[];
}

export function AutomationManager({ initialSettings }: AutomationManagerProps) {
  const [settings, setSettings] = useState<AutomationSetting[]>(initialSettings);
  const [isPending, startTransition] = useTransition();

  const groupedSettings = settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    },
    {} as Record<string, AutomationSetting[]>
  );

  const categoryLabels: Record<string, string> = {
    appointments: "📅 Appointments",
    inventory: "📦 Inventory",
    reporting: "📊 Reporting",
    notifications: "🔔 Notifications",
    social: "📱 Social Media",
  };

  function handleToggle(key: string) {
    startTransition(async () => {
      const result = await toggleAutomationSetting(key);
      if (result.success) {
        setSettings((prev) =>
          prev.map((s) =>
            s.key === key ? { ...s, value: s.value === "1" ? "0" : "1" } : s
          )
        );
        toast.success("Setting updated");
      } else {
        toast.error(result.error || "Failed to update setting");
      }
    });
  }

  function handleNumberChange(key: string, newValue: string) {
    startTransition(async () => {
      const result = await updateAutomationSetting(key, newValue);
      if (result.success) {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
        );
        toast.success("Setting updated");
      } else {
        toast.error(result.error || "Failed to update setting");
      }
    });
  }

  function handleTimeChange(key: string, newValue: string) {
    startTransition(async () => {
      const result = await updateAutomationSetting(key, newValue);
      if (result.success) {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
        );
        toast.success("Setting updated");
      } else {
        toast.error(result.error || "Failed to update setting");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Automation workflows</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {categoryLabels[category] || category}
            </h3>

            <div className="space-y-3">
              {categorySettings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-1">
                    <Label className="text-sm font-medium">{setting.label}</Label>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    {setting.type === "boolean" && (
                      <Button
                        type="button"
                        variant={setting.value === "1" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggle(setting.key)}
                        disabled={isPending}
                      >
                        {setting.value === "1" ? "Enabled" : "Disabled"}
                      </Button>
                    )}

                    {setting.type === "number" && (
                      <Input
                        type="number"
                        value={setting.value}
                        onChange={(e) => handleNumberChange(setting.key, e.target.value)}
                        min={setting.minValue ? Number(setting.minValue) : undefined}
                        max={setting.maxValue ? Number(setting.maxValue) : undefined}
                        className="w-24"
                        disabled={isPending}
                        onBlur={(e) => {
                          if (e.target.value !== setting.value) {
                            handleNumberChange(setting.key, e.target.value);
                          }
                        }}
                      />
                    )}

                    {setting.type === "time" && (
                      <Input
                        type="time"
                        value={setting.value}
                        onChange={(e) => handleTimeChange(setting.key, e.target.value)}
                        className="w-32"
                        disabled={isPending}
                        onBlur={(e) => {
                          if (e.target.value !== setting.value) {
                            handleTimeChange(setting.key, e.target.value);
                          }
                        }}
                      />
                    )}

                    {setting.type === "text" && (
                      <Input
                        type="text"
                        value={setting.value}
                        onChange={(e) => updateAutomationSetting(setting.key, e.target.value)}
                        className="w-48"
                        disabled={isPending}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-medium">💡 Tip</p>
          <p className="mt-1">
            Changes take effect immediately for new events. Background jobs currently running will complete with previous settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
