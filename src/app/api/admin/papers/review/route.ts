import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

/**
 * List papers awaiting review (default: DRAFT).
 * Optional query: ?status=PUBLISHED|DRAFT
 */
export async function GET(req: Request) {
  const staff = await requireStaff(["ADMIN"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "DRAFT").toUpperCase();

    await dbConnect();

    const docs = await QuestionPaper.find({ status })
      .select({
        title: 1,
        ownerName: 1,
        ownerInitial: 1,
        subjects: 1,
        departments: 1,
        itemCount: 1,
        createdAt: 1,
        publishedAt: 1,
        status: 1,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const papers = (docs || []).map((d: any) => ({
      id: String(d._id),
      title: d.title,
      ownerName: d.ownerName,
      ownerInitial: d.ownerInitial,
      subjects: d.subjects || [],
      departments: (d.departments || []).map((x: any) => x.slug),
      itemCount: d.itemCount || 0,
      createdAt: d.createdAt,
      publishedAt: d.publishedAt || null,
      status: d.status,
    }));

    return NextResponse.json({ papers });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/staff/papers/review] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
