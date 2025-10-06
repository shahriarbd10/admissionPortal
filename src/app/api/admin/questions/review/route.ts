// src/app/api/admin/questions/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

type PopulatedSubject = { slug?: string; name?: string; _id?: unknown };

export async function GET(_req: NextRequest) {
  try {
    const who = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!who) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const docs = await QuestionPaper.find({
      status: { $in: ["DRAFT", "REVIEW"] },
    })
      .sort({ createdAt: -1 })
      .select({
        title: 1,
        subjects: 1,
        departments: 1,
        itemCount: 1,
        status: 1,
        createdAt: 1,
      })
      .populate("subjects", { slug: 1, name: 1 })
      .lean()
      .exec();

    const items = (docs || []).map((d: any) => {
      const subj: { slug: string; name: string }[] = Array.isArray(d.subjects)
        ? (d.subjects as PopulatedSubject[]).map((s) => ({
            slug: String(s.slug ?? ""),
            name: String(s.name ?? ""),
          }))
        : [];

      const deptSlugs: string[] = Array.isArray(d.departments)
        ? d.departments.map((x: any) =>
            typeof x === "string" ? x : String(x?.slug ?? "")
          )
        : [];

      return {
        _id: String(d._id),
        title: String(d.title),
        status: String(d.status),
        createdAt: d.createdAt,
        itemCount: Number(d.itemCount ?? 0),
        subjects: subj,                    // [{ slug, name }]
        subjectSlugs: subj.map((s) => s.slug),
        departments: deptSlugs,            // ["cse", "eee", ...]
        applicableDepartments: deptSlugs,  // back-compat
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("[/api/admin/questions/review] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
