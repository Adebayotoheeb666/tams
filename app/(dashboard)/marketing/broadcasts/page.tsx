import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createBroadcast,
  getBroadcasts,
  updateBroadcastDelivery,
  createBroadcastABTest,
  determineABTestWinner,
  syncBroadcastWinnerToBuffer,
} from "@/lib/actions/marketing";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

async function createBroadcastAction(formData: FormData) {
  "use server";

  await createBroadcast({
    campaignId: formData.get("campaignId") || undefined,
    broadcastText: formData.get("broadcastText")?.toString() || "",
    broadcastImageUrl: formData.get("broadcastImageUrl") || undefined,
    recipientsSegment: (formData.get("recipientsSegment") as string) || "all",
    scheduledDate: formData.get("scheduledDate") || undefined,
  });
}

async function markBroadcastSentAction(formData: FormData) {
  "use server";

  const broadcastId = formData.get("broadcastId")?.toString();
  if (!broadcastId) return;

  await updateBroadcastDelivery(broadcastId, {
    status: "sent",
    sentCount: 1,
    sentDate: new Date().toISOString(),
  });
}

async function createABTestAction(formData: FormData) {
  "use server";

  await createBroadcastABTest(
    formData.get("campaignId")?.toString() || "",
    formData.get("textA")?.toString() || "",
    formData.get("textB")?.toString() || "",
    formData.get("segment")?.toString() || "all",
    formData.get("scheduledDate")?.toString() || ""
  );
}

async function computeABWinnerAction(formData: FormData) {
  "use server";

  const broadcastId = formData.get("broadcastId")?.toString();
  if (!broadcastId) return;

  await determineABTestWinner(broadcastId);
}

async function syncWinnerToBufferAction(formData: FormData) {
  "use server";

  const broadcastId = formData.get("broadcastId")?.toString();
  const platform = (formData.get("platform") as string) || "instagram";
  if (!broadcastId) return;

  await syncBroadcastWinnerToBuffer(broadcastId, platform as "instagram" | "tiktok" | "youtube");
}

export default async function BroadcastsPage() {
  const result = await getBroadcasts();
  const broadcasts = result.success ? result.data : [];

  return (
    <MarketingPageShell title="WhatsApp Broadcasts" description="Create broadcasts, A/B test messages, and sync to Buffer.">
      {/* Standard Broadcast */}
      <Card>
        <CardHeader>
          <CardTitle>Create broadcast</CardTitle>
          <CardDescription>Send timely messages to customer segments (VIP, repeat, new, inactive, all).</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createBroadcastAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="broadcastText">
                Message
              </label>
              <Textarea id="broadcastText" name="broadcastText" placeholder="Share a promo, reminder, or welcoming note" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="recipientsSegment">
                Segment
              </label>
              <select id="recipientsSegment" name="recipientsSegment" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="all">
                <option value="vip">VIP</option>
                <option value="repeat_customer">Repeat customer</option>
                <option value="new_customer">New customer</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="scheduledDate">
                Scheduled date
              </label>
              <Input id="scheduledDate" name="scheduledDate" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="broadcastImageUrl">
                Image URL (optional)
              </label>
              <Input id="broadcastImageUrl" name="broadcastImageUrl" type="url" placeholder="https://example.com/image.jpg" />
            </div>
            <Button type="submit">Queue broadcast</Button>
          </form>
        </CardContent>
      </Card>

      {/* A/B Test */}
      <Card>
        <CardHeader>
          <CardTitle>A/B Test broadcast</CardTitle>
          <CardDescription>Test two message variants and measure engagement to find the winner.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createABTestAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="textA">
                  Variant A
                </label>
                <Textarea id="textA" name="textA" placeholder="First version of your message" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="textB">
                  Variant B
                </label>
                <Textarea id="textB" name="textB" placeholder="Second version to compare" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="segment">
                  Segment to test
                </label>
                <select id="segment" name="segment" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="all">
                  <option value="vip">VIP</option>
                  <option value="repeat_customer">Repeat customer</option>
                  <option value="new_customer">New customer</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="scheduledDate">
                  Send date
                </label>
                <Input id="scheduledDate" name="scheduledDate" type="date" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="campaignId">
                  Campaign ID (optional)
                </label>
                <Input id="campaignId" name="campaignId" placeholder="campaign-id" />
              </div>
            </div>

            <Button type="submit">Create A/B Test</Button>
          </form>
        </CardContent>
      </Card>

      {/* Broadcasts List with Delivery & A/B Test Results */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Broadcasts</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {broadcasts
              .filter((b: any) => !b.isABTest || b.variantLabel)
              .map((broadcast: any) => (
                <Card key={broadcast.id} className={broadcast.variantLabel ? "border-blue-200" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{broadcast.recipientsSegment}</CardTitle>
                        <CardDescription>{broadcast.status}</CardDescription>
                      </div>
                      {broadcast.variantLabel && (
                        <Badge variant="secondary">Variant {broadcast.variantLabel}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground line-clamp-3">{broadcast.broadcastText}</p>

                    <div className="grid grid-cols-2 gap-2 py-2 border-t border-b">
                      <div>
                        <p className="text-xs text-muted-foreground">Recipients</p>
                        <p className="font-semibold">{broadcast.totalRecipients || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sent</p>
                        <p className="font-semibold">{broadcast.sentCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Read</p>
                        <p className="font-semibold">{broadcast.readCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Delivery</p>
                        <p className="font-semibold">{broadcast.performance?.deliveryRate ?? 0}%</p>
                      </div>
                    </div>
                    {broadcast.bufferPostId ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                        Synced to Buffer as {broadcast.bufferPostId}
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <form action={markBroadcastSentAction} className="flex-1">
                        <input type="hidden" name="broadcastId" value={broadcast.id} />
                        <Button type="submit" variant="outline" size="sm" className="w-full">
                          Mark as sent
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* A/B Test Results */}
        {broadcasts.some((b: any) => b.isABTest && !b.variantLabel) && (
          <div>
            <h3 className="text-lg font-semibold mb-4">A/B Test Results</h3>
            <div className="grid gap-4">
              {broadcasts
                .filter((b: any) => b.isABTest && !b.variantLabel)
                .map((test: any) => (
                  <Card key={test.id} className="border-amber-200 bg-amber-50/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">A/B Test: {test.recipientsSegment}</CardTitle>
                          <CardDescription>
                            {test.winnerVariant ? `Winner: Variant ${test.winnerVariant}` : "Pending results"}
                          </CardDescription>
                        </div>
                        {test.winnerVariant && <Badge className="bg-amber-200 text-amber-900">Winner: {test.winnerVariant}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {["A", "B"].map((variant) => {
                          const variantBroadcast = broadcasts.find((b: any) => b.parentBroadcastId === test.id && b.variantLabel === variant);
                          if (!variantBroadcast) return null;

                          const sentCount = variantBroadcast.sentCount || 0;
                          const engagementRate =
                            sentCount > 0
                              ? (
                                  ((variantBroadcast.readCount || 0) + (variantBroadcast.clickCount || 0)) /
                                  sentCount
                                ) * 100
                              : 0;

                          return (
                            <div key={variant} className="rounded-lg border p-3 space-y-2">
                              <p className="font-semibold text-sm">Variant {variant}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{variantBroadcast.broadcastText}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t">
                                <div>
                                  <p className="text-muted-foreground">Sent</p>
                                  <p className="font-semibold">{sentCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Engagement</p>
                                  <p className="font-semibold">{engagementRate.toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {!test.winnerVariant && (
                        <form action={computeABWinnerAction} className="mt-4">
                          <input type="hidden" name="broadcastId" value={test.id} />
                          <Button type="submit" variant="outline" size="sm">
                            Compute winner
                          </Button>
                        </form>
                      )}
                        {test.winnerVariant && (
                        <div className="space-y-2">
                          <form action={syncWinnerToBufferAction} className="mt-4">
                            <input type="hidden" name="broadcastId" value={test.id} />
                            <input type="hidden" name="platform" value="instagram" />
                            <Button type="submit" variant="secondary" size="sm">
                              Sync winner to Buffer
                            </Button>
                          </form>
                          <p className="text-xs text-muted-foreground">
                            Buffer sync will schedule the winning variant as a social post.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Buffer Integration Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Buffer Integration</CardTitle>
          <CardDescription>Sync broadcast winners to Buffer for auto-posting to social media</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            ✅ A/B test winners can be synced to Buffer for Instagram, TikTok, or other platforms
          </p>
          <p className="text-xs text-muted-foreground">
            Set <code>BUFFER_ACCESS_TOKEN</code> and <code>BUFFER_PROFILE_ID</code> in your environment to enable syncing.
          </p>
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
}
