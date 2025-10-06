// src/app/api/admin/questions/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // Next 15: params is a Promise
) {
  // Only ADMIN can approve/publish
  const who = await requireStaff(["ADMIN"]);
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await dbConnect();

    const doc = await QuestionPaper.findByIdAndUpdate(
      id,
      { $set: { status: "PUBLISHED", reviewedBy: who.id, publishedAt: new Date() } },
      { new: true }
    )
      .select({ _id: 1 })
      .lean()
      .exec();

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/admin/questions/[id]/approve] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
