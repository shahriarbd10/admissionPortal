import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaff(["ADMIN"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();

    const doc = await QuestionPaper.findById(params.id)
      .select({ status: 1 })
      .lean()
      .exec();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const current = (doc as any).status as string;
    if (current === "PUBLISHED") {
      return NextResponse.json({ ok: true, already: true });
    }

    await QuestionPaper.updateOne(
      { _id: params.id },
      { $set: { status: "PUBLISHED", publishedAt: new Date() } }
    ).exec();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/admin/papers/:id/publish] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
