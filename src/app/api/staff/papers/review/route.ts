import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

/**
 * List papers by status (default DRAFT).
 * Optional query params:
 *  - status=DRAFT|PUBLISHED   (default DRAFT)
 *  - department=<slug>        (optional filter)
 */
export async function GET(req: Request) {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "DRAFT").toUpperCase();
    const department = (url.searchParams.get("department") || "").toLowerCase().trim();

    await dbConnect();

    const q: any = { status };
    if (department) q["departments.slug"] = department;

    const docs = await QuestionPaper.find(q)
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
      .sort({ publishedAt: -1, createdAt: -1 })
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
      status: d.status as "DRAFT" | "PUBLISHED",
    }));

    return NextResponse.json({ papers });
  } catch (e: any) {
    console.error("[/api/staff/papers/review] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
