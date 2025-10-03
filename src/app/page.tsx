"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Brand / title area (kept minimal; no extra content) */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-md shadow-fuchsia-300/30" />
            <span className="text-base sm:text-lg font-semibold tracking-tight">
              Admission Portal
            </span>
          </div>

          <Link
            href="/staff-login"
            className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            Admin / Moderator Login
          </Link>
        </div>
      </header>

      {/* Center card */}
      <section className="flex-1 grid place-items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.05)] ring-1 ring-black/5">
          {/* card header */}
          <div className="px-6 sm:px-8 pt-7 sm:pt-9">
            <h1 className="text-2xl sm:text-3xl font-semibold text-center tracking-tight">
              Student Admission Portal
            </h1>
            <p className="mt-2 text-center text-sm sm:text-base text-neutral-600 leading-relaxed">
              Log in with your <strong>Admission Form ID</strong> and{" "}
              <strong>Phone OTP</strong>
            </p>
          </div>

          {/* call to action */}
          <div className="px-6 sm:px-8 pb-7 sm:pb-9 pt-5">
            <Link
              href="/login"
              className="block w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-5 py-3 text-center text-sm sm:text-base font-medium text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              Student Login
            </Link>

            {/* helpful micro text (no extra content, just polish) */}
            <p className="mt-3 text-center text-xs text-neutral-500">
              Secure OTP-based sign-in • ~1 minute
            </p>
          </div>

          {/* soft divider with gradient */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
          {/* ambient bottom glow */}
          <div className="relative h-0">
            <div className="pointer-events-none absolute inset-x-10 -bottom-4 h-16 rounded-full blur-2xl bg-gradient-to-r from-indigo-300/30 via-fuchsia-300/30 to-rose-300/30" />
          </div>
        </div>
      </section>

      {/* Footer (minimal, aligns with premium feel) */}
      <footer className="w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-center text-xs sm:text-sm text-neutral-500">
          © {new Date().getFullYear()} Admission Portal
        </div>
      </footer>
    </main>
  );
}
