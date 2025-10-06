// src/app/api/admin/papers/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

type PaperStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> } // Next 15: params is a Promise
) {
  const staff = await requireStaff(["ADMIN"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await dbConnect();

    const doc = await QuestionPaper.findById(id)
      .select({ status: 1 })
      .lean<{ status: PaperStatus }>()
      .exec();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (doc.status === "PUBLISHED") {
      // Idempotent publish
      return NextResponse.json({ ok: true, already: true });
    }

    await QuestionPaper.updateOne(
      { _id: id },
      { $set: { status: "PUBLISHED", publishedAt: new Date() } }
    ).exec();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/admin/papers/[id]/publish] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
