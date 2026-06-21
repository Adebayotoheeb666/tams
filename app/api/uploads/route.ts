import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "accountant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Image upload is not configured. Please set Cloudinary credentials." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mime = file.type || "application/octet-stream";
    const dataUri = `data:${mime};base64,${base64}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "products",
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
