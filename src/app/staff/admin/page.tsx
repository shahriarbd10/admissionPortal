import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage exams, view submissions, and explore analytics.
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
            className="rounded-2xl border bg-white/80 p-5 shadow-sm transition hover:shadow backdrop-blur"
          >
            <div className="text-sm font-medium text-neutral-500">Reports</div>
            <div className="mt-1 text-lg font-semibold">Exam Submissions</div>
            <p className="mt-2 text-sm text-neutral-600">
              Inspect submitted papers, see objective marks and GPA-weighted totals.
            </p>
          </Link>

          <div
            className="rounded-2xl border bg-white/60 p-5 opacity-60 shadow-sm"
            title="Coming soon"
          >
            <div className="text-sm font-medium text-neutral-500">Question Bank</div>
            <div className="mt-1 text-lg font-semibold">Author & Review</div>
            <p className="mt-2 text-sm text-neutral-600">
              Create question sets and publish per department. (Phase 2)
            </p>
          </div>

          <div
            className="rounded-2xl border bg-white/60 p-5 opacity-60 shadow-sm"
            title="Coming soon"
          >
            <div className="text-sm font-medium text-neutral-500">Setup</div>
            <div className="mt-1 text-lg font-semibold">Windows & Duration</div>
            <p className="mt-2 text-sm text-neutral-600">
              Configure durations, windows, and capacity. (Phase 3)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
