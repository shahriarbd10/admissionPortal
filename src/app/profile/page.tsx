// src/app/profile/page.tsx
import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";
import ProfileDepartmentSelect from "@/components/ProfileDepartmentSelect";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
          <Link href="/" className="text-sm text-indigo-700 hover:underline" prefetch={false}>
            Back to Home
          </Link>
        </header>

        {/* Profile form (name/parents/GPA/AFID/phone) */}
        <ProfileForm />

        {/* Department selection lives INSIDE profile */}
        <section className="rounded-2xl border bg-white/80 p-6 shadow backdrop-blur">
          <h2 className="text-lg font-semibold mb-1">Select Your Department</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Choose one open department. Your demo exam will be generated for this department.
          </p>
          <ProfileDepartmentSelect />
        </section>

        {/* Start Exam */}
        <section className="rounded-2xl border bg-white/80 p-6 shadow backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ready to take the demo exam?</h2>
              <p className="text-sm text-neutral-600">
                50 questions • 60 minutes • Department-wise paper • Auto-save enabled
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Tip: Make sure you’ve selected your department above first.
              </p>
            </div>
            <Link
              href="/exam"
              className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
            >
              Start Exam
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
