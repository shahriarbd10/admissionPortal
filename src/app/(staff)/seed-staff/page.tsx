export default function SeedStaffPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-xl font-semibold">Seed Staff</h1>
      <p className="text-sm text-neutral-600">Enter SECURITY KEY to create first admin.</p>
      {/* simple form → POST /api/admin/users/seed */}
    </div>
  );
}
