import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { ContentForm } from "@/components/marketing/content-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSubmitButton } from "@/components/ui/loading-submit-button";
import { getContentCalendar, syncContentToBuffer, getBufferStats } from "@/lib/actions/marketing";

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
          <ContentForm />
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
