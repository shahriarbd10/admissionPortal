import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { ExamSubject } from "@/lib/models/ExamSubject";
import { requireStaff } from "@/lib/staffSession";

export async function POST(req: Request) {
  try {
    const staff = await requireStaff(["ADMIN"]);
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subjects } = await req.json().catch(() => ({ subjects: [] as any[] }));
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ error: "No subjects provided" }, { status: 400 });
    }

    await dbConnect();

    for (const s of subjects) {
      const slug = String(s.slug || "").trim().toLowerCase();
      const name = String(s.name || "").trim();
      if (!slug || !name) continue;
      await ExamSubject.updateOne({ slug }, { $set: { slug, name } }, { upsert: true }).exec();
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/admin/subjects/seed] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
