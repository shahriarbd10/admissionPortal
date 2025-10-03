// src/app/api/me/departments/select/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { Department } from "@/lib/models/Department";
import { User } from "@/lib/models/User";
import { departmentSelectSchema } from "@/lib/schemas";
import type { DepartmentDoc } from "@/lib/models/Department";
import type { UserDoc } from "@/lib/models/User";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__Host_session";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getDecodedFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(
    new RegExp(`(?:^|;\\s*)${escapeRegex(SESSION_COOKIE_NAME)}=([^;]+)`)
  );
  const sessionCookie = m?.[1];
  if (!sessionCookie) return null;
  try {
    return await adminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const decoded = await getDecodedFromCookie(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = departmentSelectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { slug } = parsed.data;

  await dbConnect();

  // Load a single department and type it explicitly
  const dept = await Department.findOne({ slug, isActive: true })
    .lean<DepartmentDoc | null>()
    .exec();

  if (!dept) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  // Window guard
  const now = new Date();
  if (now < new Date(dept.windowStart) || now > new Date(dept.windowEnd)) {
    return NextResponse.json(
      { error: "Selection window is closed for this department" },
      { status: 403 }
    );
  }

  // Upsert selection for the current user
  const updated = await User.findOneAndUpdate(
    { firebaseUid: decoded.uid },
    {
      $set: {
        firebaseUid: decoded.uid,
        phone: decoded.phone_number || "",
        selectedDepartmentSlug: slug,
        selectedDepartmentAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
    .lean<UserDoc | null>()
    .exec();

  if (!updated) {
    return NextResponse.json({ error: "Failed to update selection" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    selected: updated.selectedDepartmentSlug,
    at: updated.selectedDepartmentAt,
  });
}
