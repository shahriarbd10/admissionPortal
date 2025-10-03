"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col">
      {/* Top-right staff login */}
      <header className="flex justify-end p-4">
        <Link
          href="/staff-login"
          className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 transition"
        >
          Admin / Moderator Login
        </Link>
      </header>

      {/* Center student login */}
      <section className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur shadow-xl p-8">
          <h1 className="text-2xl font-semibold text-center mb-2">
            Student Admission Portal
          </h1>
          <p className="text-center text-sm text-neutral-500 mb-6">
            Log in with your <strong>Admission Form ID</strong> and <strong>Phone OTP</strong>
          </p>
          <Link
            href="/login"
            className="block w-full rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-5 py-3 text-center font-medium text-white shadow hover:opacity-90 transition"
          >
            Student Login
          </Link>
        </div>
      </section>
    </main>
  );
}
