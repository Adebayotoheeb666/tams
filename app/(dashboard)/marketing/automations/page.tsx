import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAutomationSettings, updateAutomationSetting } from "@/lib/actions/automation";
import { normalizeAutomationSettingValue } from "@/lib/utils/marketing/automation-settings";
import { redirect } from "next/navigation";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

async function updateAutomationSettingsAction(formData: FormData) {
  "use server";

  const settings = await getAutomationSettings();

  for (const setting of settings) {
    const fieldName = `setting-${setting.key}`;
    const rawValue = formData.get(fieldName);

    if (setting.type === "boolean") {
      const value = rawValue === null ? "0" : normalizeAutomationSettingValue(rawValue, "boolean");
      await updateAutomationSetting(setting.key, value);
      continue;
    }

    const value = normalizeAutomationSettingValue(rawValue, setting.type === "number" ? "number" : "text");
    await updateAutomationSetting(setting.key, value);
  }

  redirect("/marketing/automations");
}

export default async function AutomationsPage() {
  const settings = await getAutomationSettings();

  return (
    <MarketingPageShell title="Automations" description="Review your connected marketing automations and workflow settings.">
      <Card>
        <CardHeader>
          <CardTitle>Configured automations</CardTitle>
          <CardDescription>These settings drive the n8n and social-post workflows behind the marketing hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateAutomationSettingsAction} className="space-y-4">
            {settings.map((setting: any) => (
              <div key={setting.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{setting.label}</p>
                    <p className="text-muted-foreground">{setting.description || "No description provided"}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide">{setting.category}</p>
                  </div>
                  <div className="min-w-[180px]">
                    {setting.type === "boolean" ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name={`setting-${setting.key}`} value="1" defaultChecked={setting.value === "1"} />
                        Enabled
                      </label>
                    ) : setting.type === "number" ? (
                      <Input
                        name={`setting-${setting.key}`}
                        type="number"
                        defaultValue={setting.value}
                        min={setting.minValue}
                        max={setting.maxValue}
                      />
                    ) : (
                      <Input name={`setting-${setting.key}`} defaultValue={setting.value} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
}
