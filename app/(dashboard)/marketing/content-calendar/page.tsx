import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSubmitButton } from "@/components/ui/loading-submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createContentPost, getContentCalendar, syncContentToBuffer, getBufferStats } from "@/lib/actions/marketing";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

async function createContentAction(formData: FormData) {
  "use server";

  await createContentPost({
    campaignId: formData.get("campaignId") || undefined,
    platform: formData.get("platform") || "instagram",
    contentType: formData.get("contentType") || "product_showcase",
    title: formData.get("title") || "New content",
    caption: formData.get("caption") || undefined,
    contentUrl: formData.get("contentUrl")?.toString() || undefined,
    contentFile: formData.get("contentFile") instanceof File ? formData.get("contentFile") : undefined,
    scheduledDate: formData.get("scheduledDate") || undefined,
    hashtags: formData.getAll("hashtags").map(String),
    targetAudience: formData.get("targetAudience") || undefined,
    callToAction: formData.get("callToAction") || undefined,
  });
}

async function syncContentBufferAction(formData: FormData) {
  "use server";

  const contentId = formData.get("contentId")?.toString();
  if (!contentId) return;

  await syncContentToBuffer(contentId);
}

export default async function ContentCalendarPage() {
  const result = await getContentCalendar();
  const bufferStatsResult = await getBufferStats();
  const posts = result.success ? result.data : [];
  const bufferStats = bufferStatsResult.success ? bufferStatsResult.data : null;

  return (
    <MarketingPageShell title="Content Calendar" description="Plan and publish content across the key marketing channels.">
      <Card>
        <CardHeader>
          <CardTitle>Schedule a post</CardTitle>
          <CardDescription>Add social content for the next launch or promotion.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createContentAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input id="title" name="title" placeholder="Behind the scenes: new nail set" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="platform">
                Platform
              </label>
              <select id="platform" name="platform" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="instagram">
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="contentType">
                Content type
              </label>
              <select id="contentType" name="contentType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="product_showcase">
                <option value="product_showcase">Product showcase</option>
                <option value="behind_the_scenes">Behind the scenes</option>
                <option value="social_proof">Social proof</option>
                <option value="tutorial">Tutorial</option>
                <option value="engagement">Engagement</option>
                <option value="offer">Offer</option>
                <option value="story">Story</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="caption">
                Caption
              </label>
              <Textarea id="caption" name="caption" placeholder="What should the audience feel or do?" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="scheduledDate">
                Scheduled date
              </label>
              <Input id="scheduledDate" name="scheduledDate" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="contentFile">
                Upload content
              </label>
              <Input id="contentFile" name="contentFile" type="file" accept="image/*,video/*" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="contentUrl">
                Reference URL (optional)
              </label>
              <Input id="contentUrl" name="contentUrl" type="url" placeholder="https://..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="targetAudience">
                Target audience
              </label>
              <Input id="targetAudience" name="targetAudience" placeholder="VIP clients, first-time visitors" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="callToAction">
                Call to action
              </label>
              <Input id="callToAction" name="callToAction" placeholder="Book your appointment today" />
            </div>
            <LoadingSubmitButton type="submit">Save post</LoadingSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Buffer sync status</CardTitle>
          <CardDescription>Connect your Buffer account to schedule social posts from content calendar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {bufferStats ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Profiles linked</p>
                <p className="font-semibold">{bufferStats.profilesCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Buffer updates</p>
                <p className="font-semibold">{bufferStats.pendingUpdates}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last synced</p>
                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Set <code>BUFFER_ACCESS_TOKEN</code> and <code>BUFFER_PROFILE_ID</code> in your environment to enable Buffer sync.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post: any) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>{post.platform} • {post.contentType}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Status: {post.status}</p>
              <p>Scheduled: {post.scheduledDate || "Not scheduled"}</p>
              <p>Caption: {post.caption || "No caption yet"}</p>
              {post.bufferPostId ? (
                <p className="text-xs text-emerald-700">Synced to Buffer: {post.bufferPostId}</p>
              ) : (
                <form action={syncContentBufferAction} className="mt-3">
                  <input type="hidden" name="contentId" value={post.id} />
                  <LoadingSubmitButton type="submit" variant="outline" size="sm" className="w-full">
                    Sync to Buffer
                  </LoadingSubmitButton>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingPageShell>
  );
}
