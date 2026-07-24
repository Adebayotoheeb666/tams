import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getContentPostById, updateContentPost, deleteContentPost } from "@/lib/actions/marketing";
import { redirect, notFound } from "next/navigation";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "posted", label: "Posted" },
  { value: "cancelled", label: "Cancelled" },
] as const;

async function updateContentPostAction(formData: FormData) {
  "use server";

  const postId = formData.get("postId")?.toString();
  if (!postId) return;

  const hashtags = formData
    .get("hashtags")
    ?.toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean) || [];

  await updateContentPost({
    id: postId,
    title: formData.get("title")?.toString(),
    caption: formData.get("caption")?.toString(),
    status: formData.get("status")?.toString(),
    scheduledDate: formData.get("scheduledDate")?.toString(),
    hashtags,
  });

  redirect(`/marketing/content-calendar/${postId}`);
}

async function deleteContentPostAction(formData: FormData) {
  "use server";

  const postId = formData.get("postId")?.toString();
  if (!postId) return;

  await deleteContentPost(postId);
  redirect("/marketing/content-calendar");
}

export default async function ContentPostDetailPage({ params }: { params: { id: string } }) {
  const result = await getContentPostById(params.id);
  if (!result.success || !result.data) {
    notFound();
  }

  const post = result.data;

  return (
    <MarketingPageShell title="Post detail" description="Edit or remove this content post.">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription>{post.platform} • {post.contentType}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Status: {post.status}</p>
            <p>Scheduled: {post.scheduledDate || "Not scheduled"}</p>
            <p>Caption: {post.caption || "No caption yet"}</p>
            {post.contentUrl ? (
              <p>
                Content URL: <a href={post.contentUrl} target="_blank" rel="noreferrer" className="underline">View content</a>
              </p>
            ) : null}
            <p>Hashtags: {(post.hashtags || []).join(", ")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit post</CardTitle>
            <CardDescription>Adjust the caption, schedule, or status.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateContentPostAction} className="grid gap-4">
              <input type="hidden" name="postId" value={post.id} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">Title</label>
                <Input id="title" name="title" defaultValue={post.title} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="caption">Caption</label>
                <Textarea id="caption" name="caption" defaultValue={post.caption || ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={post.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm">
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="scheduledDate">Scheduled date</label>
                <Input id="scheduledDate" name="scheduledDate" type="date" defaultValue={post.scheduledDate || ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="hashtags">Hashtags</label>
                <Input id="hashtags" name="hashtags" defaultValue={(post.hashtags || []).join(", ")} placeholder="sale, new arrival" />
              </div>
              <Button type="submit">Save post</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete post</CardTitle>
            <CardDescription>Remove this content post if it should no longer appear in the calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteContentPostAction} className="space-y-4">
              <input type="hidden" name="postId" value={post.id} />
              <p className="text-sm text-muted-foreground">
                Deleting the post permanently removes it from the content calendar.
              </p>
              <Button type="submit" variant="destructive">Delete post</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
