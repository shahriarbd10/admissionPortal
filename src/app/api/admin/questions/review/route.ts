import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function GET() {
  try {
    const who = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const Paper = await QuestionPaper();
    const list = await Paper.find({ status: "REVIEW" })
      .sort({ createdAt: -1 })
      .select({ title: 1, applicableDepartments: 1, categories: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ items: list.map(d => ({ ...d, _id: String(d._id) })) });
  } catch (e: any) {
    console.error("[/api/admin/questions/review] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
