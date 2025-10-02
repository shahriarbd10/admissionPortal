import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/User"; // keep your import

import { profileUpdateSchema } from "@/lib/schemas";

// Define the lean shape we actually read in responses
type UserLean = {
  firebaseUid: string;
  admissionFormId?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  sscGPA?: string | number;
  hscGPA?: string | number;
  phone?: string;
  _id?: unknown;
};

async function getDecodedFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)__Host_session=([^;]+)/);
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

    // ⬇️ Force the correct lean shape so it's not inferred as array | object
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
            sscGPA: doc.sscGPA ?? "",
            hscGPA: doc.hscGPA ?? "",
            phone: doc.phone || decoded.phone_number || "",
          }
        : {
            admissionFormId: "",
            name: "",
            fatherName: "",
            motherName: "",
            sscGPA: "",
            hscGPA: "",
            phone: decoded.phone_number || "",
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

    if (admissionFormId) {
      const exists = await User.findOne({
        admissionFormId,
        firebaseUid: { $ne: decoded.uid },
      })
        .lean<Pick<UserLean, "admissionFormId" | "firebaseUid"> | null>()
        .exec();

      if (exists) {
        return NextResponse.json(
          { error: "This Admission Form ID is already in use." },
          { status: 409 }
        );
      }
    }

    const phone = decoded.phone_number || "";

    const doc = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $set: {
          firebaseUid: decoded.uid,
          phone,
          admissionFormId: admissionFormId ?? undefined,
          name,
          fatherName,
          motherName,
          sscGPA,
          hscGPA,
        },
      },
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
