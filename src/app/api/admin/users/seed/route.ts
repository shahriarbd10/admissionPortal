// src/app/api/admin/users/seed/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Staff } from "@/lib/models/Staff";
import { hash } from "@/lib/hash";

type StaffLean = {
  _id: unknown;
  role: "ADMIN" | "MODERATOR";
};

export async function POST(req: Request) {
  try {
    const { securityKey, username, email, password, role } = await req.json();

    if (securityKey !== process.env.STAFF_SEED_SECURITY_KEY) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["ADMIN", "MODERATOR"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const usernameClean = (username ?? "").trim() || undefined;
    const emailLower = (email ?? "").toLowerCase().trim() || undefined;

    if (!usernameClean && !emailLower) {
      return NextResponse.json({ error: "Provide username or email" }, { status: 400 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: "Password is too short" }, { status: 400 });
    }

    await dbConnect();
    const passwordHash = await hash(password);

    // Query by whichever identifier(s) were provided
    const query =
      usernameClean && emailLower
        ? { $or: [{ username: usernameClean }, { email: emailLower }] }
        : usernameClean
        ? { username: usernameClean }
        : { email: emailLower };

    const update = {
      $set: {
        username: usernameClean,
        email: emailLower,
        passwordHash,
        role, // "ADMIN" | "MODERATOR"
      },
      $setOnInsert: { createdAt: new Date() },
    };

    const doc = await Staff.findOneAndUpdate(query, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
      .lean<StaffLean | null>()
      .exec();

    return NextResponse.json({
      ok: true,
      userId: doc?._id ? String(doc._id) : null,
      role: doc?.role ?? role,
    });
  } catch (e: any) {
    console.error("[/api/admin/users/seed] error:", e?.message || e);
    const msg =
      e?.code === 11000
        ? `Duplicate key: ${JSON.stringify(e?.keyValue)}`
        : e?.message || "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
