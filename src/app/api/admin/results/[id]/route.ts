import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { requireStaff } from "@/lib/staffSession";

// In Next.js 15, the dynamic route `params` is a Promise and must be awaited.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const staff = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const doc = await ExamAttempt.findById(id).lean().exec();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Normalize possible older/newer field names so the UI always works
    const department =
      (doc as any).department ?? (doc as any).departmentSlug ?? "";
    const startAt = (doc as any).startAt ?? (doc as any).startedAt ?? null;
    const gpaWeighted =
      (doc as any).gpaWeighted ?? (doc as any).gpaweighted ?? 0;

    // Convert paper into the shape the admin detail UI expects
    const paper = Array.isArray((doc as any).paper)
      ? (doc as any).paper.map((it: any) => {
          const base = {
            i: typeof it.i === "number" ? it.i : 0,
            id: typeof it.id === "string" ? it.id : `q${it.i ?? 0}`,
            type: it.type as "MCQ" | "TF" | "FIB",
            q: it.q as string,
            hint: it.hint ?? null,
          };

          if (it.type === "MCQ") {
            return {
              ...base,
              options: it.options ?? [],
              correctIndex: typeof it.answerKey === "number" ? it.answerKey : undefined,
            };
          }
          if (it.type === "TF") {
            return {
              ...base,
              options: ["False", "True"],
              correctIndex: typeof it.answerKey === "number" ? it.answerKey : undefined,
            };
          }
          // FIB
          return {
            ...base,
            correctText:
              typeof it.answerKey === "string" ? it.answerKey : undefined,
          };
        })
      : [];

    // Results saved on submit
    const results = Array.isArray((doc as any).results) ? (doc as any).results : [];

    return NextResponse.json({
      attempt: {
        _id: String((doc as any)._id),
        department,
        startAt,
        endAt: (doc as any).endAt ?? null,
        submittedAt: (doc as any).submittedAt ?? null,
        examScore: (doc as any).examScore ?? 0,
        gpaWeighted,
        applicantName: (doc as any).applicantName ?? "",
        applicantAfid: (doc as any).applicantAfid ?? "",
        applicantPhone: (doc as any).applicantPhone ?? "",
        paper,
        results,
      },
    });
  } catch (e: any) {
    console.error("[/api/admin/results/:id] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
