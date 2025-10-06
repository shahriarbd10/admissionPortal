import { NextRequest, NextResponse } from "next/server";
import { QuestionPaper } from "@/lib/models/QuestionPaper";
import { requireStaff } from "@/lib/staffSession"; // not required for students; this route is public for students

export async function GET(req: NextRequest) {
  try {
    const dept = (new URL(req.url).searchParams.get("dept") || "").toLowerCase();
    if (!dept) return NextResponse.json({ error: "dept query required" }, { status: 400 });

    const Paper = await QuestionPaper();
    const doc = await Paper.findOne({
      status: "PUBLISHED",
      applicableDepartments: dept,
    })
      .sort({ publishedAt: -1 })
      .lean();

    if (!doc) return NextResponse.json({ paper: null });

    // sanitize for client (no answerKey)
    const items = (doc.items || []).map((it: any) => ({
      i: it.i,
      id: it.id,
      type: it.type,
      q: it.q,
      options: it.type !== "FIB" ? it.options : undefined,
      hint: it.hint ?? null,
    }));

    return NextResponse.json({
      paper: {
        _id: String(doc._id),
        title: doc.title,
        departments: doc.applicableDepartments,
        items,
      },
    });
  } catch (e: any) {
    console.error("[/api/exam/paper/latest] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
