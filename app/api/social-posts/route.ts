import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSocialPosts, scheduleSocialPost } from "@/lib/actions/social-media";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await getSocialPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const post = await scheduleSocialPost(payload);
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule post" },
      { status: 400 },
    );
  }
}
