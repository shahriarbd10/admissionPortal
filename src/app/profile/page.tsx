import { requireUser } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-sm text-neutral-600">
            Signed in as <span className="font-medium">{user.phone_number}</span>
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="px-3 py-2 rounded-lg border">Logout</button>
        </form>
      </div>

      <ProfileForm />
    </main>
  );
}
