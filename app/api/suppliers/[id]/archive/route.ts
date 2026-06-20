import { NextResponse } from "next/server";
import { archiveSupplier } from "@/lib/actions/suppliers";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const result = await archiveSupplier(params.id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
