// src/app/api/auth/student/verify/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/User";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "__Host_session";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 7); // you can set in .env

export async function POST(req: Request) {
  const { idToken, afid } = await req.json();

  if (!idToken || !afid) {
    return NextResponse.json(
      { error: "Missing idToken or AFID" },
      { status: 400 }
    );
  }

  try {
    // 1) Verify Firebase ID token (ensures it came from your Firebase project)
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    const firebaseUid = decoded.uid;
    const phone = decoded.phone_number || "";

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number missing in token" },
        { status: 400 }
      );
    }

    // 2) Create long-lived Firebase session cookie so the browser stays signed in
    const expiresIn = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000; // ms
    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    const jar = await cookies();
    jar.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    // 3) Upsert user as APPLICANT (ties Firebase identity to AFID + phone)
    await dbConnect();
    await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          firebaseUid,
          phone,
          admissionFormId: afid,
          role: "APPLICANT",
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      ok: true,
      role: "APPLICANT",
      next: "/profile",
    });
  } catch (e: any) {
    console.error("[api/auth/student/verify] error:", e?.message || e);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 401 }
    );
  }
}
