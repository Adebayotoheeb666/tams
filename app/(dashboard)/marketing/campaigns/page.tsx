import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { createMarketingCampaign, getCampaigns } from "@/lib/actions/marketing";

async function createCampaignAction(formData: FormData) {
  "use server";

  await createMarketingCampaign({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    campaignType: formData.get("campaignType") || "awareness",
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    targetPlatforms: formData.getAll("targetPlatforms").map(String),
    goalDescription: formData.get("goalDescription") || undefined,
    budgetAllocation: Number(formData.get("budgetAllocation") || 0),
  });
}

export default async function CampaignsPage() {
  const result = await getCampaigns();
  const campaigns = result.success ? result.data : [];

  return (
    <MarketingPageShell title="Campaigns" description="Create and track campaigns across your growth channels.">
      <Card>
        <CardHeader>
          <CardTitle>New campaign</CardTitle>
          <CardDescription>Launch a campaign for offers, launches, or seasonal promotions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCampaignAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="name">
                Campaign name
              </label>
              <Input id="name" name="name" placeholder="Summer glow launch" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <Textarea id="description" name="description" placeholder="Describe the goal and tone of the campaign" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="campaignType">
                Type
              </label>
              <select id="campaignType" name="campaignType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="awareness">
                <option value="product_launch">Product launch</option>
                <option value="flash_sale">Flash sale</option>
                <option value="referral">Referral</option>
                <option value="seasonal">Seasonal</option>
                <option value="awareness">Awareness</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="budgetAllocation">
                Budget allocation (₦)
              </label>
              <Input id="budgetAllocation" name="budgetAllocation" type="number" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="startDate">
                Start date
              </label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="endDate">
                End date
              </label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Platforms</label>
              <div className="flex flex-wrap gap-3">
                {(["instagram", "tiktok", "whatsapp", "youtube"] as const).map((platform) => (
                  <label key={platform} className="flex items-center gap-2 text-sm capitalize">
                    <input type="checkbox" name="targetPlatforms" value={platform} />
                    {platform}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="goalDescription">
                Goal description
              </label>
              <Textarea id="goalDescription" name="goalDescription" placeholder="Example: increase appointment bookings by 20%" />
            </div>
            <Button type="submit">Create campaign</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign: any) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{campaign.name}</CardTitle>
                  <CardDescription>{campaign.description || "No description yet"}</CardDescription>
                </div>
                <Link href={`/marketing/campaigns/${campaign.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Status: {campaign.status}</p>
              <p>Type: {campaign.campaignType}</p>
              <p>Platforms: {(campaign.targetPlatforms || []).join(", ")}</p>
              <p>Budget: ₦{Number(campaign.budgetAllocation || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingPageShell>
  );
}
