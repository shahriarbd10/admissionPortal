"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { phoneLoginSchema } from "@/lib/schemas";
import { initFirebaseClient, startPhoneOtp } from "@/lib/firebaseClient";
import {
  Smartphone,
  ShieldCheck,
  KeyRound,
  Loader2,
  ChevronLeft,
  Flag,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type ConfirmationResult = import("firebase/auth").ConfirmationResult;
type Country = { code: string; dial: string; label: string; flag: string };

// Prevent static generation / prerender for this page
export const dynamic = "force-dynamic";

const COUNTRIES: Country[] = [
  { code: "BD", dial: "+880", label: "Bangladesh", flag: "🇧🇩" },
  { code: "IN", dial: "+91", label: "India", flag: "🇮🇳" },
  { code: "PK", dial: "+92", label: "Pakistan", flag: "🇵🇰" },
  { code: "US", dial: "+1", label: "United States", flag: "🇺🇸" },
  { code: "GB", dial: "+44", label: "United Kingdom", flag: "🇬🇧" },
];

/** The inner client component that actually calls useSearchParams */
function LoginContent() {
  const params = useSearchParams();
  const next = params.get("next") || "/profile";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [afid, setAfid] = useState("");
  const [countryDial, setCountryDial] = useState("+880"); // default BD
  const [localNumber, setLocalNumber] = useState(""); // digits only
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const [conf, setConf] = useState<ConfirmationResult | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null
  );

  // Preload Firebase client
  useEffect(() => {
    initFirebaseClient().catch(() => {});
  }, []);

  // Auto-pick country by locale (optional)
  useEffect(() => {
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale.toUpperCase();
      if (locale.includes("-IN")) setCountryDial("+91");
      else if (locale.includes("-PK")) setCountryDial("+92");
      else if (locale.includes("-US")) setCountryDial("+1");
      else if (locale.includes("-GB")) setCountryDial("+44");
    } catch {}
  }, []);

  const fullPhone = useMemo(
    () => `${countryDial}${localNumber}`,
    [countryDial, localNumber]
  );

  const showToast = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2200);
  };

  async function handleSend() {
    setBusy(true);
    try {
      phoneLoginSchema.parse({ afid, phone: fullPhone });
      const { auth } = await initFirebaseClient();
      const c = await startPhoneOtp(auth, fullPhone);
      setConf(c);
      setStep("otp");
      showToast("ok", "OTP sent to your phone.");
      setTimeout(() => inputsRef.current[0]?.focus(), 200);
    } catch (e: unknown) {
      const err = e as { message?: string };
      showToast("err", err?.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!conf) return;
    const code = otp.join("");
    if (code.length !== 6) {
      showToast("err", "Enter the 6-digit code");
      return;
    }
    setBusy(true);
    try {
      const cred = await conf.confirm(code);
      const idToken = await cred.user.getIdToken();

      const r = await fetch("/api/auth/student/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, afid }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Login failed");
      showToast("ok", "Verified!");
      window.location.href = next || data?.next || "/profile";
    } catch (e: unknown) {
      const err = e as { message?: string };
      showToast("err", err?.message || "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  function updateOtp(idx: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  function handleOtpKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(60%_40%_at_10%_0%,#dbeafe_0%,transparent_60%),radial-gradient(50%_35%_at_100%_10%,#fce7f3_0%,transparent_55%)]">
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <motion.div
          className="w-full max-w-xl rounded-3xl border bg-white/75 p-6 shadow-xl backdrop-blur-md md:p-8"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <Smartphone className="h-6 w-6 text-indigo-600" />
                Student Sign-in
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                AFID + Phone OTP to access your profile.
              </p>
            </div>
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                className={`mb-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  toast.kind === "ok"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                }`}
              >
                {toast.kind === "ok" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.form
                key="phone"
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* AFID */}
                <Field label="Admission Form ID">
                  <input
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="AFID-2025-00123"
                    value={afid}
                    onChange={(e) => setAfid(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </Field>

                {/* Phone */}
                <Field label="Phone">
                  <div className="mt-1 flex gap-2">
                    <div className="relative">
                      <Flag className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                      <select
                        aria-label="Country code"
                        className="w-28 rounded-xl border border-neutral-200 bg-gray-50 pl-8 pr-2 py-2 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        value={countryDial}
                        onChange={(e) => setCountryDial(e.target.value)}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.dial}>
                            {c.flag} {c.dial}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      aria-label="Phone number"
                      className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Phone number"
                      value={localNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                        setLocalNumber(digits);
                      }}
                      inputMode="numeric"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={busy || !afid || !localNumber}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {busy ? "Sending…" : "Send OTP"}
                </button>
                <div id="recaptcha-container" />
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleVerify();
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Field label="Enter 6-digit OTP">
                  <div className="mt-1 grid grid-cols-6 gap-2">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputsRef.current[i] = el;
                        }}
                        className="h-12 w-full rounded-xl border border-neutral-200 text-center text-lg outline-none transition focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                        value={d}
                        onChange={(e) => updateOtp(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKey(i, e)}
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </Field>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    {busy ? "Verifying…" : "Verify & Continue"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Your number is used only for sign-in. We never share it.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  // ✅ Wrap the component that calls useSearchParams in Suspense
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      {children}
    </label>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: any;
    _confirmation: any;
  }
}
