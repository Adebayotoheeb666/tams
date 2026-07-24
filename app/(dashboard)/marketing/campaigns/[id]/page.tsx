import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCampaignById, updateMarketingCampaign, deleteMarketingCampaign } from "@/lib/actions/marketing";
import { redirect, notFound } from "next/navigation";

const campaignTypes = [
  { value: "product_launch", label: "Product launch" },
  { value: "flash_sale", label: "Flash sale" },
  { value: "referral", label: "Referral" },
  { value: "seasonal", label: "Seasonal" },
  { value: "awareness", label: "Awareness" },
] as const;

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
] as const;

const platforms = ["instagram", "tiktok", "whatsapp", "youtube"] as const;

async function updateCampaignAction(formData: FormData) {
  "use server";

  const campaignId = formData.get("campaignId")?.toString();
  if (!campaignId) return;

  await updateMarketingCampaign({
    id: campaignId,
    name: formData.get("name")?.toString(),
    description: formData.get("description")?.toString(),
    status: formData.get("status")?.toString(),
    campaignType: formData.get("campaignType")?.toString(),
    startDate: formData.get("startDate")?.toString(),
    endDate: formData.get("endDate")?.toString(),
    goalDescription: formData.get("goalDescription")?.toString(),
    budgetAllocation: Number(formData.get("budgetAllocation") || 0),
    targetPlatforms: formData.getAll("targetPlatforms").map(String),
  });

  redirect(`/marketing/campaigns/${campaignId}`);
}

async function deleteCampaignAction(formData: FormData) {
  "use server";

  const campaignId = formData.get("campaignId")?.toString();
  if (!campaignId) return;

  await deleteMarketingCampaign(campaignId);
  redirect("/marketing/campaigns");
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const result = await getCampaignById(params.id);
  if (!result.success || !result.data) {
    notFound();
  }

  const campaign = result.data;

  return (
    <MarketingPageShell title="Campaign detail" description="View and edit campaign settings.">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>{campaign.description || "No description"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Status: {campaign.status}</p>
            <p>Type: {campaign.campaignType}</p>
            <p>Platforms: {(campaign.targetPlatforms || []).join(", ")}</p>
            <p>Budget: ₦{Number(campaign.budgetAllocation || 0).toLocaleString()}</p>
            <p>Start: {campaign.startDate || "Not set"}</p>
            <p>End: {campaign.endDate || "Not set"}</p>
            <p>Goal: {campaign.goalDescription || "None"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit campaign</CardTitle>
            <CardDescription>Update the campaign details and status.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCampaignAction} className="grid gap-4">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">Name</label>
                <Input id="name" name="name" defaultValue={campaign.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="description">Description</label>
                <Textarea id="description" name="description" defaultValue={campaign.description || ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={campaign.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm">
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="campaignType">Type</label>
                <select id="campaignType" name="campaignType" defaultValue={campaign.campaignType} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm">
                  {campaignTypes.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="startDate">Start date</label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={campaign.startDate || ""} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="endDate">End date</label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={campaign.endDate || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {platforms.map((platform) => (
                    <label key={platform} className="flex items-center gap-2 text-sm capitalize">
                      <input
                        type="checkbox"
                        name="targetPlatforms"
                        value={platform}
                        defaultChecked={(campaign.targetPlatforms || []).includes(platform)}
                      />
                      {platform}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="budgetAllocation">Budget allocation</label>
                <Input id="budgetAllocation" name="budgetAllocation" type="number" defaultValue={campaign.budgetAllocation?.toString() || "0"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="goalDescription">Goal description</label>
                <Textarea id="goalDescription" name="goalDescription" defaultValue={campaign.goalDescription || ""} />
              </div>
              <Button type="submit">Save campaign</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete campaign</CardTitle>
            <CardDescription>Delete this campaign and detach it from any related content posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteCampaignAction} className="space-y-4">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <p className="text-sm text-muted-foreground">
                Deleting a campaign will remove it permanently and clear its assignment from related content posts.
              </p>
              <Button type="submit" variant="destructive">Delete campaign</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
