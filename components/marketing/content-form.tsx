"use client";

import { useState } from "react";
import { createContentPost } from "@/lib/actions/marketing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSubmitButton } from "@/components/ui/loading-submit-button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ContentForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      let contentUrl = formData.get("contentUrl")?.toString();

      if (file) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          const uploadRes = await fetch("/api/uploads", {
            method: "POST",
            body: uploadFormData,
          });
          const uploadJson = await uploadRes.json();
          if (!uploadRes.ok) {
            toast.error(uploadJson.error || "Failed to upload file");
            return;
          }
          contentUrl = uploadJson.url;
        } catch (uploadError) {
          toast.error("File upload failed");
          console.error(uploadError);
          return;
        }
      }

      const result = await createContentPost({
        campaignId: formData.get("campaignId")?.toString() || undefined,
        platform: formData.get("platform")?.toString() || "instagram",
        contentType: formData.get("contentType")?.toString() || "product_showcase",
        title: formData.get("title")?.toString() || "New content",
        caption: formData.get("caption")?.toString() || undefined,
        contentUrl,
        scheduledDate: formData.get("scheduledDate")?.toString() || undefined,
        hashtags: formData.getAll("hashtags").map(String),
        targetAudience: formData.get("targetAudience")?.toString() || undefined,
        callToAction: formData.get("callToAction")?.toString() || undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create post");
        return;
      }

      toast.success("Post created successfully");
      e.currentTarget.reset();
      setFile(null);
    } catch (error) {
      toast.error("An error occurred while creating the post");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
        <Input
          id="contentFile"
          name="contentFile"
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
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
      <LoadingSubmitButton type="submit" disabled={isLoading} loading={isLoading}>
        Save post
      </LoadingSubmitButton>
    </form>
  );
}
