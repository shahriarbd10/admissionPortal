import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_MS } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // This is where mismatched project / bad key will throw
    const decoded = await adminAuth().verifyIdToken(idToken);

    // Create session cookie
    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_MS,
    });

    const isProd = process.env.NODE_ENV === "production";
    const res = NextResponse.json({ ok: true, uid: decoded.uid });

    // IMPORTANT: On localhost, do NOT set Secure
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${sessionCookie}; Path=/; HttpOnly; SameSite=Strict; ${
        isProd ? "Secure; " : ""
      }Max-Age=${Math.floor(SESSION_EXPIRES_MS / 1000)}`
    );
    return res;
  } catch (e: any) {
    console.error("[/api/auth/verify] verifyIdToken failed:", e?.message || e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
