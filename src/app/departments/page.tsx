import Link from "next/link";
import { requireUser } from "@/lib/session";
import DepartmentsList from "@/components/DepartmentsList";

async function fetchDepartments() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/departments?activeOnly=true`, {
    cache: "no-store",
  });
  if (!r.ok) return { departments: [] as any[] };
  return r.json();
}

export default async function DepartmentsPage() {
  await requireUser("/departments");
  const { departments } = await fetchDepartments();

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">Departments</h1>
        <Link href="/profile" className="border px-3 py-2 rounded">Profile</Link>
      </div>

      <DepartmentsList departments={departments} />
    </main>
  );
}
