import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/settings";
import { getSocialPosts } from "@/lib/actions/social-media";
import { getAutomationSettings } from "@/lib/actions/automation";
import { UserManager } from "@/components/settings/user-manager";
import { SocialMediaManager } from "@/components/settings/social-media-manager";
import { AutomationManager } from "@/components/settings/automation-manager";
import { BUSINESS_PROFILE } from "@/lib/constants/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    redirect("/");
  }

  const users = await getUsers();
  const socialPosts = await getSocialPosts();
  const automationSettings = await getAutomationSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Business profile, automation workflows, social media, and team access for Tams Beauty Hub.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Business name</p>
            <p className="font-medium">{BUSINESS_PROFILE.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Brands</p>
            <p className="font-medium">{BUSINESS_PROFILE.tagline}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{BUSINESS_PROFILE.location}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contact</p>
            <p className="font-medium">{BUSINESS_PROFILE.email}</p>
          </div>
        </CardContent>
      </Card>

      <AutomationManager initialSettings={automationSettings} />

      <SocialMediaManager initialPosts={socialPosts} />

      <UserManager users={users} />
    </div>
  );
}
