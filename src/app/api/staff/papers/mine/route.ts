import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function GET(req: Request) {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();

    const url = new URL(req.url);
    const onlyCounters = url.searchParams.get("only") === "counters";

    // Always filter by creator
    const items = await QuestionPaper.find({ createdBy: staff.id })
      .select({
        title: 1,
        status: 1,
        itemCount: 1,
        createdAt: 1,
        subjectSlugs: 1,
        subjectNames: 1,
        subjects: 1, // legacy ObjectIds (for count-only fallback)
        departments: 1, // [{slug}]
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const counters = {
      total: items.length,
      draft: items.filter((x) => x.status === "DRAFT").length,
      published: items.filter((x) => x.status === "PUBLISHED").length,
    };

    if (onlyCounters) return NextResponse.json({ counters });

    return NextResponse.json({ items, counters });
  } catch (e: any) {
    console.error("[/api/staff/papers/mine] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
