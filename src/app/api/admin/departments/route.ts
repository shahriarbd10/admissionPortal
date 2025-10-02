import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";
import { departmentUpsertSchema } from "@/lib/schemas";

function forbidIfProd() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const block = forbidIfProd(); if (block) return block;

  await dbConnect();
  const docs = await Department.find({}).sort({ name: 1 }).lean();
  return NextResponse.json({ departments: docs });
}

export async function POST(req: Request) {
  const block = forbidIfProd(); if (block) return block;

  const json = await req.json().catch(() => null);
  const parsed = departmentUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  if (d.windowEnd <= d.windowStart) {
    return NextResponse.json({ error: "windowEnd must be after windowStart" }, { status: 400 });
  }

  await dbConnect();
  await Department.updateOne(
    { slug: d.slug },
    { $set: d },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
