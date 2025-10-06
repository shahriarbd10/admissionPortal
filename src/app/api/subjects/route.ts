import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { ExamSubject } from "@/lib/models/ExamSubject";

export async function GET() {
  try {
    await dbConnect();
    const items = await ExamSubject.find({})
      .select({ slug: 1, name: 1 })
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ subjects: items });
  } catch (e: any) {
    console.error("[/api/subjects] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
