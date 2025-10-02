"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { phoneLoginSchema } from "@/lib/schemas";
import { initFirebaseClient, startPhoneOtp } from "@/lib/firebaseClient";

type ConfirmationResult = import("firebase/auth").ConfirmationResult;
type Country = { code: string; dial: string; label: string; flag: string };

const COUNTRIES: Country[] = [
  { code: "BD", dial: "+880", label: "Bangladesh", flag: "🇧🇩" },
  { code: "IN", dial: "+91", label: "India", flag: "🇮🇳" },
  { code: "PK", dial: "+92", label: "Pakistan", flag: "🇵🇰" },
  { code: "US", dial: "+1", label: "United States", flag: "🇺🇸" },
  { code: "GB", dial: "+44", label: "United Kingdom", flag: "🇬🇧" },
];

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get("next") || "/profile";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [afid, setAfid] = useState("");
  const [countryDial, setCountryDial] = useState("+880"); // default Bangladesh
  const [localNumber, setLocalNumber] = useState("");     // digits only
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [conf, setConf] = useState<ConfirmationResult | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Preload Firebase app/auth once
  useEffect(() => {
    initFirebaseClient().catch(() => {});
  }, []);

  // (Optional) auto-pick default country via locale heuristic
  useEffect(() => {
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale.toUpperCase();
      if (locale.includes("-IN")) setCountryDial("+91");
      else if (locale.includes("-PK")) setCountryDial("+92");
      else if (locale.includes("-US")) setCountryDial("+1");
      else if (locale.includes("-GB")) setCountryDial("+44");
    } catch {}
  }, []);

  // Build E.164
  const fullPhone = useMemo(() => `${countryDial}${localNumber}`, [countryDial, localNumber]);

  const handleSend = async () => {
    setBusy(true);
    setMsg(null);
    try {
      // Validate AFID + E.164
      phoneLoginSchema.parse({ afid, phone: fullPhone });

      // Optional server-side rate-limit hook (stubbed)
      await fetch("/api/auth/start", { method: "POST" });

      const { auth } = await initFirebaseClient();
      const c = await startPhoneOtp(auth, fullPhone);
      setConf(c);
      setStep("otp");
      setMsg("OTP sent to your phone.");
    } catch (e: any) {
      setMsg(e?.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!conf) return;
    setBusy(true);
    setMsg(null);
    try {
      const cred = await conf.confirm(otp.trim());
      const idToken = await cred.user.getIdToken();

      const r = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!r.ok) throw new Error("Session creation failed");

      window.location.href = next;
    } catch (e: any) {
      setMsg(e?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6">
        <h1 className="text-2xl font-semibold text-center">Sign in with Phone</h1>
        <p className="text-sm text-neutral-500 text-center mb-6">AFID + OTP</p>

        {msg && (
          <div className="mb-4 rounded bg-amber-50 text-amber-900 text-sm p-2" role="status">
            {msg}
          </div>
        )}

        {step === "phone" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            {/* AFID */}
            <div>
              <label htmlFor="afid" className="block text-sm font-medium">Admission Form ID</label>
              <input
                id="afid"
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="AFID-2025-00123"
                value={afid}
                onChange={(e) => setAfid(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {/* Country code + local number */}
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <div className="mt-1 flex gap-2">
                <select
                  aria-label="Country code"
                  className="border rounded px-3 py-2 bg-gray-50 w-28"
                  value={countryDial}
                  onChange={(e) => setCountryDial(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.dial}>
                      {c.flag} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Phone number"
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Phone number"
                  value={localNumber}
                  onChange={(e) => {
                    // digits only, max 15 chars to be safe for E.164
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                    setLocalNumber(digits);
                  }}
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                We’ll send the code to{" "}
                <code className="font-mono">{fullPhone || `${countryDial}...`}</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
            >
              {busy ? "Sending..." : "Send OTP"}
            </button>

            <p className="text-xs text-neutral-500 text-center">
              By continuing you agree to our Terms and acknowledge our Privacy Policy.
            </p>
          </form>
        )}

        {step === "otp" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleVerify();
            }}
          >
            <div>
              <label htmlFor="otp" className="block text-sm font-medium">Enter OTP</label>
              <input
                id="otp"
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-black text-white py-2 rounded disabled:opacity-50"
              >
                {busy ? "Verifying..." : "Verify & Continue"}
              </button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="border px-4 rounded"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
