"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col">
      {/* Top bar */}
      <header className="w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-base sm:text-lg font-semibold text-neutral-800">
            Admission Portal
          </div>
          <Link
            href="/staff-login"
            className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-white shadow transition hover:opacity-90"
          >
            Admin / Moderator Login
          </Link>
        </div>
      </header>

      {/* Hero / CTA */}
      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text */}
            <div className="order-2 lg:order-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900">
                Student Admission Portal
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed">
                Log in with your <strong>Admission Form ID</strong> and{" "}
                <strong>Phone OTP</strong> to access your profile and continue
                your application.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-5 py-3 text-sm sm:text-base font-medium text-white shadow hover:opacity-90 transition"
                >
                  Student Login
                </Link>
                <Link
                  href="/departments"
                  className="inline-flex justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm sm:text-base font-medium text-neutral-800 hover:bg-neutral-50 transition"
                >
                  View Departments
                </Link>
              </div>
            </div>

            {/* Card */}
            <div className="order-1 lg:order-2">
              <div className="w-full max-w-xl mx-auto rounded-2xl bg-white/80 backdrop-blur shadow-xl p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-center mb-2 text-neutral-900">
                  Fast & Secure Sign-in
                </h2>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>• AFID verification</li>
                  <li>• One-time password sent to your phone</li>
                  <li>• Continue where you left off</li>
                </ul>
                <Link
                  href="/login"
                  className="mt-6 block w-full rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-5 py-3 text-center font-medium text-white shadow hover:opacity-90 transition"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-center text-xs sm:text-sm text-neutral-500">
          © {new Date().getFullYear()} Admission Portal. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
