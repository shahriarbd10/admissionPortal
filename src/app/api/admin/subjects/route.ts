import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { ExamSubject } from "@/lib/models/ExamSubject";

export async function GET() {
  try {
    const staff = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const subs = await ExamSubject.find({})
      .select({ slug: 1, name: 1 })
      .sort({ name: 1 })
      .lean()
      .exec();

    return NextResponse.json({ subjects: subs });
  } catch (e: any) {
    console.error("[/api/admin/subjects] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
