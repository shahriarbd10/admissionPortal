// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { Department } from "@/lib/models/Department";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function GET() {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();

    const now = new Date();

    // Active departments: open & active right now
    const activeDeptCount = await Department.countDocuments({
      isActive: true,
      windowStart: { $lte: now },
      windowEnd: { $gte: now },
    });

    // Submitted exam attempts
    const submissionsCount = await ExamAttempt.countDocuments({ status: "submitted" });

    // Count of departments that currently have at least one published set
    // (supports both `departments.slug` and legacy `applicableDepartments.slug`)
    const a = await QuestionPaper.distinct("departments.slug", { status: "PUBLISHED" });
    const b = await QuestionPaper.distinct("applicableDepartments.slug", { status: "PUBLISHED" });
    const publishedDeptCount = new Set(
      [...a, ...b].filter(Boolean).map((s) => String(s).toLowerCase())
    ).size;

    return NextResponse.json({
      ok: true,
      stats: { publishedDeptCount, submissionsCount, activeDeptCount },
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/admin/stats] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
