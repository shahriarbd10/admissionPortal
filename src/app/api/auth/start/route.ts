import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Redis rate-limit here
  return NextResponse.json({ ok: true });
}
