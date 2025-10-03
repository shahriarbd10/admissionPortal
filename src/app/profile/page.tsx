// src/app/profile/page.tsx
import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
          <Link
            href="/"
            className="text-sm text-indigo-700 hover:underline"
            prefetch={false}
          >
            Back to Home
          </Link>
        </header>

        {/* Profile form (student info) */}
        <ProfileForm />
      </div>
    </main>
  );
}
