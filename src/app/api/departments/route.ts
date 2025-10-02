import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";
import { departmentsQuerySchema } from "@/lib/schemas";

export const revalidate = 0; // we’ll set cache headers manually

export async function GET(req: Request) {
  // Parse query
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parse = departmentsQuerySchema.safeParse(params);
  const activeOnly = parse.success ? parse.data.activeOnly : undefined;

  await dbConnect();

  const now = new Date();
  const filter: Record<string, any> = { isActive: true };
  if (activeOnly) {
    filter.windowStart = { $lte: now };
    filter.windowEnd = { $gte: now };
  }

  const docs = await Department.find(filter).sort({ name: 1 }).lean();

  const res = NextResponse.json({
    departments: docs.map((d) => ({
      slug: d.slug,
      name: d.name,
      windowStart: d.windowStart,
      windowEnd: d.windowEnd,
      capacity: d.capacity ?? null,
      isActive: d.isActive,
    })),
  });

  // Public cache for 5 minutes; allow stale-while-revalidate
  res.headers.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=300");
  return res;
}
