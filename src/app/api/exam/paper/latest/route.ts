// src/app/api/exam/paper/latest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { QuestionPaper } from "@/lib/models/QuestionPaper";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dept = (url.searchParams.get("dept") || "").toLowerCase().trim();
    if (!dept) {
      return NextResponse.json({ error: "dept query required" }, { status: 400 });
    }

    await dbConnect();

    // Support current structure (departments: [{ slug }]) and legacy fallbacks.
    const doc = await QuestionPaper.findOne({
      status: "PUBLISHED",
      $or: [
        { "departments.slug": dept }, // current
        { departments: dept },        // if stored as string[]
        { applicableDepartments: dept }, // legacy field
      ],
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean()
      .exec();

    if (!doc) {
      return NextResponse.json({ paper: null });
    }

    // Sanitize items for client (strip answers)
    const items = Array.isArray((doc as any).items)
      ? (doc as any).items.map((it: any, idx: number) => ({
          i: typeof it.i === "number" ? it.i : idx,
          id: String(it.id),
          type: it.type as "MCQ" | "TF" | "FIB",
          q: String(it.q),
          options: it.type !== "FIB" ? (it.options ?? []).map(String) : undefined,
          hint: it.hint ?? null,
        }))
      : [];

    // Normalize departments field for the response
    const departments =
      (doc as any).departments ??
      (doc as any).applicableDepartments ??
      [];

    return NextResponse.json({
      paper: {
        _id: String((doc as any)._id),
        title: String((doc as any).title ?? ""),
        departments,
        items,
      },
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/exam/paper/latest] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
