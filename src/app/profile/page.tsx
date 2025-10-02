import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <form action="/api/auth/logout" method="post">
          <button className="border px-3 py-2 rounded">Logout</button>
        </form>
      </div>
      <div className="mt-4 border rounded p-4 bg-white">
        <p><b>UID:</b> {user.uid}</p>
        {user.phone_number && <p><b>Phone:</b> {user.phone_number}</p>}
      </div>
    </main>
  );
}
