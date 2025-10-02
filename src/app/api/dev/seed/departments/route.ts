import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  await dbConnect();

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const items = [
    { slug: "cse", name: "Computer Science & Engineering", windowStart: now, windowEnd: end, capacity: 200, isActive: true },
    { slug: "eee", name: "Electrical & Electronic Engineering", windowStart: now, windowEnd: end, capacity: 150, isActive: true },
    { slug: "bba", name: "Business Administration", windowStart: now, windowEnd: end, capacity: 180, isActive: true },
    { slug: "eng", name: "English", windowStart: now, windowEnd: end, capacity: 120, isActive: true },
  ];

  const ops = items.map((d) => ({
    updateOne: { filter: { slug: d.slug }, update: { $set: d }, upsert: true }
  }));

  await Department.bulkWrite(ops);

  return NextResponse.json({ ok: true, count: items.length });
}
