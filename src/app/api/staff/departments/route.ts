import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";
import { requireStaff } from "@/lib/staffSession";

export async function GET() {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const items = await Department.find({})
      .select({ slug: 1, name: 1, isActive: 1 })
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ departments: items });
  } catch (e: any) {
    console.error("[/api/staff/departments] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
