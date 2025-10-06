import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const who = await requireStaff(["ADMIN"]);
    if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const Paper = await QuestionPaper();
    const doc = await Paper.findByIdAndUpdate(
      id,
      { $set: { status: "PUBLISHED", reviewedBy: who.uid, publishedAt: new Date() } },
      { new: true }
    ).lean();

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[approve paper] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
