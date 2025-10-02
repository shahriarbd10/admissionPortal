import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";

export async function GET() {
  try {
    const m = await dbConnect();
    return NextResponse.json({
      ok: true,
      host: m.connection.host,
      name: m.connection.name,
      readyState: m.connection.readyState,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
