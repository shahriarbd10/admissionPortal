// src/app/api/me/profile/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/User";
import { profileUpdateSchema } from "@/lib/schemas";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__Host_session";

// Lean shape we actually read
type UserLean = {
  firebaseUid: string;
  admissionFormId?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  sscGPA?: number;
  hscGPA?: number;
  phone?: string;
  selectedDepartmentSlug?: string;
  selectedDepartmentAt?: Date;
  _id?: unknown;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getDecodedFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  // read cookie by configured name safely
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${escapeRegex(SESSION_COOKIE_NAME)}=([^;]+)`)
  );
  const sessionCookie = match?.[1];
  if (!sessionCookie) return null;
  try {
    return await adminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const decoded = await getDecodedFromCookie(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();

    const doc = await User.findOne({ firebaseUid: decoded.uid })
      .lean<UserLean | null>()
      .exec();

    return NextResponse.json({
      profile: doc
        ? {
            admissionFormId: doc.admissionFormId || "",
            name: doc.name || "",
            fatherName: doc.fatherName || "",
            motherName: doc.motherName || "",
            sscGPA: typeof doc.sscGPA === "number" ? doc.sscGPA : "",
            hscGPA: typeof doc.hscGPA === "number" ? doc.hscGPA : "",
            phone: doc.phone || decoded.phone_number || "",
            selectedDepartmentSlug: doc.selectedDepartmentSlug || "",
            selectedDepartmentAt: doc.selectedDepartmentAt || null,
          }
        : {
            admissionFormId: "",
            name: "",
            fatherName: "",
            motherName: "",
            sscGPA: "",
            hscGPA: "",
            phone: decoded.phone_number || "",
            selectedDepartmentSlug: "",
            selectedDepartmentAt: null,
          },
    });
  } catch (e: any) {
    console.error("[/api/me/profile] GET error:", e?.message || e);
    return NextResponse.json(
      { error: "Database connection failed. Check Atlas IP allowlist & MONGODB_URI." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const decoded = await getDecodedFromCookie(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { admissionFormId, name, fatherName, motherName, sscGPA, hscGPA } = parsed.data;

    await dbConnect();

    // Uniqueness check for AFID if provided
    if (admissionFormId) {
      const exists = await User.findOne({
        admissionFormId,
        firebaseUid: { $ne: decoded.uid },
      })
        .select({ _id: 1 })
        .lean<{ _id: unknown } | null>()
        .exec();

      if (exists) {
        return NextResponse.json(
          { error: "This Admission Form ID is already in use." },
          { status: 409 }
        );
      }
    }

    const phone = decoded.phone_number || "";

    // Build $set only with defined values
    const update: Record<string, unknown> = {
      firebaseUid: decoded.uid,
      phone,
      name,
      fatherName,
      motherName,
    };
    if (admissionFormId !== undefined) update.admissionFormId = admissionFormId;
    if (typeof sscGPA === "number") update.sscGPA = sscGPA;
    if (typeof hscGPA === "number") update.hscGPA = hscGPA;

    const doc = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .lean<UserLean | null>()
      .exec();

    return NextResponse.json({ ok: true, profile: doc });
  } catch (e: any) {
    console.error("[/api/me/profile] PUT error:", e?.message || e);
    return NextResponse.json(
      { error: "Save failed (database). Check Atlas IP allowlist & MONGODB_URI." },
      { status: 500 }
    );
  }
}
