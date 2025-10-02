import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold mb-2">Admission Portal</h1>
      <p className="text-neutral-600 mb-6">Start by signing in with your phone number (OTP).</p>
      <div className="flex gap-3">
        <Link href="/login" className="px-4 py-2 rounded-lg bg-black text-white">Login</Link>
        <Link href="/profile" className="px-4 py-2 rounded-lg border">Profile (protected)</Link>
      </div>
    </main>
  );
}
