export type ContentCalendarPayload = {
  campaignId?: string;
  platform: string;
  contentType: string;
  title: string;
  caption?: string;
  contentUrl?: string;
  contentFile?: File | Blob | null;
  scheduledDate?: string;
  hashtags?: string[];
  targetAudience?: string;
  callToAction?: string;
};

export async function normalizeContentPostInput(input: ContentCalendarPayload) {
  const contentFile = input.contentFile;
  const contentUrl = input.contentUrl?.trim();

  let resolvedContentUrl: string | undefined;

  if (contentFile instanceof File || contentFile instanceof Blob) {
    const arrayBuffer = await contentFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = contentFile.type || "application/octet-stream";
    resolvedContentUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  } else if (contentUrl) {
    resolvedContentUrl = contentUrl;
  }

  return {
    ...input,
    contentUrl: resolvedContentUrl,
  };
}
