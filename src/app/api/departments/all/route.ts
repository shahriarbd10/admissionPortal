import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffSession";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";

export async function GET() {
  try {
    const who = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const docs = await Department.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({
      departments: docs.map((d) => ({
        slug: d.slug,
        name: d.name,
        isActive: d.isActive,
      })),
    });
  } catch (e: any) {
    console.error("[/api/departments/all] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
