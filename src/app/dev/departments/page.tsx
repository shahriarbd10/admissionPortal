import DepartmentsAdmin from "@/components/DepartmentsAdmin";
import { requireUser } from "@/lib/session";

async function fetchAll() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/departments`, { cache: "no-store" });
  const data = await r.json().catch(() => ({ departments: [] }));
  return data.departments ?? [];
}

export default async function DevDepartmentsPage() {
  // simple login guard (any logged-in user allowed in dev)
  await requireUser("/dev/departments");

  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold mb-2">Departments (Admin)</h1>
        <p className="text-sm text-red-600">This page is disabled in production.</p>
      </main>
    );
  }

  const departments = await fetchAll();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Departments (Dev Admin)</h1>
      <p className="text-sm text-neutral-600">Add, edit, or delete departments for testing.</p>
      <DepartmentsAdmin initialItems={departments} />
    </main>
  );
}
