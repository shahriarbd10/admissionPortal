// src/app/api/departments/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("activeOnly") === "true";

    await dbConnect();

    const q = activeOnly ? { isActive: true } : {};
    const items = await Department.find(q)
      .select({ slug: 1, name: 1, windowStart: 1, windowEnd: 1, isActive: 1, capacity: 1 })
      .sort({ name: 1 })
      .lean()
      .exec();

    return NextResponse.json({ departments: items });
  } catch (e: any) {
    console.error("[/api/departments] GET error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
