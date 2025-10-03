import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { requireStaff } from "@/lib/staffSession";

export async function GET(req: Request) {
  try {
    const staff = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const url = new URL(req.url);
    const dept = url.searchParams.get("department") || undefined;
    const status = url.searchParams.get("status") || "submitted";

    const q: Record<string, any> = {};
    if (dept) q.department = dept;
    if (status) q.status = status;

    const items = await ExamAttempt.find(q)
      .sort({ submittedAt: -1 })
      .select({
        department: 1,
        examScore: 1,
        gpaWeighted: 1,
        submittedAt: 1,
        applicantName: 1,
        applicantAfid: 1,
        applicantPhone: 1,
      })
      .lean()
      .exec();

    return NextResponse.json({ results: items });
  } catch (e: any) {
    console.error("[/api/admin/results] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
