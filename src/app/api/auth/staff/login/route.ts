// src/app/api/auth/staff/login/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Staff } from "@/lib/models/Staff";
import { compare } from "@/lib/hash";
import { issueStaffSession } from "@/lib/staffSession";

type StaffLoginLean = {
  _id: unknown;
  passwordHash?: string;
  role?: "ADMIN" | "MODERATOR";
};

export async function POST(req: Request) {
  try {
    const { usernameOrEmail, password } = await req.json();

    await dbConnect();
    const u = (usernameOrEmail ?? "").trim();
    const q = { $or: [{ username: u }, { email: u.toLowerCase() }] };

    const staff = await Staff.findOne(q).lean<StaffLoginLean | null>().exec();

    if (!staff?.passwordHash || !staff.role) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await compare(password, staff.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    await issueStaffSession(String(staff._id), staff.role);
    return NextResponse.json({ ok: true, role: staff.role });
  } catch (e: any) {
    console.error("[/api/auth/staff/login] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
