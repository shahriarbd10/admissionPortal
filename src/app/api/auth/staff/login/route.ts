import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { Staff } from "@/lib/models/Staff";
import { signStaffJWT, setStaffCookie } from "@/lib/staffSession";

type ParsedCreds = { usernameOrEmail: string; password: string } | null;

interface StaffLeanRow {
  _id: unknown;
  passwordHash: string;
  role: "ADMIN" | "MODERATOR";
  username?: string | null;
  email?: string | null;
}

async function parseCreds(req: Request): Promise<ParsedCreds> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  // JSON
  if (ct.includes("application/json")) {
    try {
      const b: any = await req.json();
      const usernameOrEmail = (
        b?.usernameOrEmail ??
        b?.username ??
        b?.email ??
        b?.login ??
        b?.identifier ??
        ""
      )
        .toString()
        .trim();
      const password = (b?.password ?? b?.pass ?? b?.pwd ?? "").toString();
      if (usernameOrEmail && password) return { usernameOrEmail, password };
    } catch {
      /* ignore and fall through */
    }
  }

  // Form data (multipart / urlencoded)
  try {
    const fd = await req.formData();
    const usernameOrEmail = (
      fd.get("usernameOrEmail") ??
      fd.get("username") ??
      fd.get("email") ??
      fd.get("login") ??
      fd.get("identifier") ??
      ""
    )
      .toString()
      .trim();
    const password = (fd.get("password") ?? fd.get("pass") ?? fd.get("pwd") ?? "")
      .toString();
    if (usernameOrEmail && password) return { usernameOrEmail, password };
  } catch {
    /* ignore */
  }

  // Raw urlencoded body (edge clients)
  try {
    const text = await req.text();
    if (text) {
      const p = new URLSearchParams(text);
      const usernameOrEmail =
        p.get("usernameOrEmail") ||
        p.get("username") ||
        p.get("email") ||
        p.get("login") ||
        p.get("identifier") ||
        "";
      const password = p.get("password") || p.get("pass") || p.get("pwd") || "";
      if (usernameOrEmail && password) {
        return { usernameOrEmail: usernameOrEmail.trim(), password };
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const parsed = await parseCreds(req);
    if (!parsed) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    let { usernameOrEmail, password } = parsed;
    if (usernameOrEmail.includes("@")) {
      usernameOrEmail = usernameOrEmail.toLowerCase();
    }

    await dbConnect();

    const q =
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail.trim() }
        : { username: usernameOrEmail.trim() };

    const found = await Staff.findOne(q)
      .select({ _id: 1, passwordHash: 1, role: 1, username: 1, email: 1 })
      .lean()
      .exec();

    const staff = (found ?? null) as unknown as StaffLeanRow | null;

    if (!staff?.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (staff.role !== "ADMIN" && staff.role !== "MODERATOR") {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }

    const token = signStaffJWT({ sid: String(staff._id), role: staff.role });
    await setStaffCookie(token);

    return NextResponse.json({
      ok: true,
      role: staff.role,
      staff: {
        id: String(staff._id),
        username: staff.username ?? null,
        email: staff.email ?? null,
      },
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/auth/staff/login] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
