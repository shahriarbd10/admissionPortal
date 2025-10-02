import { requireUser } from "@/lib/session";
import { departments } from "@/data/departments";

export default async function DepartmentsPage() {
  await requireUser("/departments");
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">Departments</h1>
      <ul className="grid gap-3">
        {departments.map((d) => (
          <li key={d.id} className="border rounded p-4 bg-white">
            <div className="font-medium">{d.name}</div>
            <div className="text-xs text-neutral-500">id: {d.id}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
