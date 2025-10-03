// src/app/staff/admin/page.tsx
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage programs, questions, and view submissions.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white"
            prefetch={false}
          >
            Back to Home
          </Link>
        </header>

        {/* Quick cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/staff/admin/results"
            className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow transition"
          >
            <div className="text-sm font-medium text-neutral-500">Reports</div>
            <div className="mt-1 text-lg font-semibold">Exam Submissions</div>
            <p className="mt-2 text-sm text-neutral-600">
              See submitted papers with Exam Score & GPA-weighted marks.
            </p>
          </Link>

          <Link
            href="#"
            className="rounded-2xl border bg-white p-5 shadow-sm opacity-60 pointer-events-none"
            title="Coming soon"
          >
            <div className="text-sm font-medium text-neutral-500">Questions</div>
            <div className="mt-1 text-lg font-semibold">Question Bank</div>
            <p className="mt-2 text-sm text-neutral-600">
              Author, review, and publish questions (Phase 2).
            </p>
          </Link>

          <Link
            href="#"
            className="rounded-2xl border bg-white p-5 shadow-sm opacity-60 pointer-events-none"
            title="Coming soon"
          >
            <div className="text-sm font-medium text-neutral-500">Setup</div>
            <div className="mt-1 text-lg font-semibold">Exams & Windows</div>
            <p className="mt-2 text-sm text-neutral-600">
              Configure durations, windows, and counts (Phase 3).
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
