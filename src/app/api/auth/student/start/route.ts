import { NextResponse } from "next/server";
import { checkOtpLimits } from "@/lib/rateLimit";
// call your existing Firebase phone sign-in start here

export async function POST(req: Request) {
  const { phone, afid } = await req.json();
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "unknown";
  const allowed = await checkOtpLimits(phone, ip);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try later." }, { status: 429 });
  }
  // TODO: verify AFID matches a user/record before sending OTP (optional)
  // TODO: trigger Firebase OTP (client verifier or server trigger based on your flow)
  return NextResponse.json({ ok: true });
}
