// src/app/api/admin/questions/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // Next 15: params is a Promise
) {
  try {
    const who = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!who) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    await dbConnect();

    const updated = await QuestionPaper.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "DRAFT",         // move back to draft (reject)
          reviewedBy: who.id,      // use `who.id` (not `who.uid`)
          reviewedAt: new Date(),
        },
      },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/admin/questions/[id]/reject] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
