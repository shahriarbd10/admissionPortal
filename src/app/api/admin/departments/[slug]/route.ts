import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";
import { departmentUpdateSchema } from "@/lib/schemas";

function forbidIfProd() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const block = forbidIfProd(); if (block) return block;

  const { slug } = await params;

  const body = await req.json().catch(() => null as unknown);
  const parsed = departmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  if (d.windowStart && d.windowEnd && d.windowEnd <= d.windowStart) {
    return NextResponse.json({ error: "windowEnd must be after windowStart" }, { status: 400 });
  }

  await dbConnect();
  const res = await Department.findOneAndUpdate(
    { slug },
    { $set: d },
    { new: true }
  ).lean();

  if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, department: res });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const block = forbidIfProd(); if (block) return block;

  const { slug } = await params;

  await dbConnect();
  const res = await Department.deleteOne({ slug });
  if (res.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
