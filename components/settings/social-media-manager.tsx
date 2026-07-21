import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SocialPost } from "@/lib/db/schema";

export function SocialMediaManager({
  initialPosts,
  scheduleAction,
}: {
  initialPosts: SocialPost[];
  scheduleAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Social media automation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={scheduleAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              name="platform"
              defaultValue="instagram"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Schedule for</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue="" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea id="caption" name="caption" rows={4} placeholder="Write the post caption" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" name="imageUrl" placeholder="https://example.com/image.jpg" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input id="hashtags" name="hashtags" placeholder="#beauty #glam" />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Schedule post</Button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Scheduled posts</h3>
            <Link href="/api/social-posts" className="text-sm text-primary">
              API
            </Link>
          </div>

          {initialPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {initialPosts.map((post) => (
                <div key={post.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium capitalize">{post.platform}</p>
                      <p className="text-muted-foreground">{post.caption}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase">
                      {post.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scheduled: {new Date(post.scheduledAt).toLocaleString()} 
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
