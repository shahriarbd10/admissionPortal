// src/app/(staff)/staff-login/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Home,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();

  // form state
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  // ui state
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [capsOn, setCapsOn] = useState(false);

  // simple validation
  const usernameError = useMemo(() => {
    if (!usernameOrEmail.trim()) return "Enter username or email";
    return null;
  }, [usernameOrEmail]);

  const passwordError = useMemo(() => {
    if (!password.trim()) return "Enter your password";
    return null;
  }, [password]);

  const formInvalid = !!usernameError || !!passwordError;

  const userInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    userInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formInvalid || busy) return;

    setBusy(true);
    setMsg(null);
    setOkMsg(null);

    try {
      const res = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `remember` is a UI hint; server uses its own cookie TTL
        body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");

      setOkMsg("Signed in successfully");
      setTimeout(() => {
        if (data.role === "ADMIN") router.push("/staff/admin");
        else if (data.role === "MODERATOR") router.push("/staff/moderator");
        else setMsg("Unknown role");
      }, 300);
    } catch (e: any) {
      setMsg(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function onPasswordKey(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsOn((e.getModifierState && e.getModifierState("CapsLock")) || false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1000px_420px_at_10%_-5%,rgba(99,102,241,.18),transparent_60%),radial-gradient(800px_320px_at_110%_-10%,rgba(236,72,153,.16),transparent_55%),linear-gradient(to_bottom_right,#f8fafc,#ffffff)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
        {/* Card */}
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-white/70 shadow-xl backdrop-blur-md">
          {/* Header band */}
          <div className="relative flex items-center justify-between border-b bg-gradient-to-r from-indigo-50 via-white to-fuchsia-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Staff Portal</h1>
                <p className="text-xs text-neutral-500">Admins &amp; Moderators</p>
              </div>
            </div>

            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-white/60 px-3 py-2 text-sm text-neutral-700 hover:bg-white"
              aria-label="Back to Home"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-6">
            {msg && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>{msg}</div>
              </div>
            )}

            {okMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <div>{okMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Username or Email</span>
                <div
                  className={`relative rounded-xl border bg-white ${
                    usernameError ? "border-rose-300" : "border-neutral-200"
                  } focus-within:ring-2 focus-within:ring-indigo-100`}
                >
                  <span className="pointer-events-none absolute left-3 top-2.5 text-neutral-400">
                    {usernameOrEmail.includes("@") ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </span>
                  <input
                    ref={userInputRef}
                    type="text"
                    className="h-11 w-full rounded-xl bg-transparent pl-10 pr-3 text-[15px] outline-none"
                    placeholder="e.g. admin or admin@univ.edu"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="username email"
                    aria-invalid={!!usernameError}
                  />
                </div>
                {usernameError && (
                  <span className="mt-1 block text-xs text-rose-600">{usernameError}</span>
                )}
              </label>

              {/* Password */}
              <label className="block">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                <div
                  className={`relative rounded-xl border bg-white ${
                    passwordError ? "border-rose-300" : "border-neutral-200"
                  } focus-within:ring-2 focus-within:ring-indigo-100`}
                >
                  <span className="pointer-events-none absolute left-3 top-2.5 text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="h-11 w-full rounded-xl bg-transparent pl-10 pr-10 text-[15px] outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={onPasswordKey}
                    autoComplete="current-password"
                    aria-invalid={!!passwordError}
                  />
                </div>
                {passwordError && (
                  <span className="mt-1 block text-xs text-rose-600">{passwordError}</span>
                )}
                {capsOn && !showPw && !passwordError && (
                  <span className="mt-1 inline-block rounded-md bg-yellow-50 px-2 py-1 text-[11px] text-yellow-800">
                    Caps Lock is ON
                  </span>
                )}
              </label>

              {/* Utility row */}
              <div className="flex items-center justify-between">
                <label className="inline-flex select-none items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember this device
                </label>
                <a
                  href="#"
                  className="text-sm text-indigo-600 underline-offset-2 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={busy || formInvalid}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:opacity-60"
                aria-busy={busy}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Footer microcopy */}
            <p className="pt-2 text-center text-xs text-neutral-500">
              Your session is secured with HTTP-only cookies.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
