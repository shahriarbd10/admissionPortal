import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { requireStaff } from "@/lib/staffSession";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const doc = await ExamAttempt.findById(params.id).lean().exec();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      attempt: {
        _id: String(doc._id),
        department: doc.department,
        startAt: doc.startAt,
        endAt: doc.endAt,
        submittedAt: doc.submittedAt,
        examScore: doc.examScore,
        gpaWeighted: doc.gpaWeighted,
        applicantName: doc.applicantName,
        applicantAfid: doc.applicantAfid,
        applicantPhone: doc.applicantPhone,
        // Admin needs full visibility:
        paper: doc.paper,
        results: doc.results,
      },
    });
  } catch (e: any) {
    console.error("[/api/admin/results/:id] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
