"use client";

type Dept = {
  slug: string;
  name: string;
  windowStart: string | Date;
  windowEnd: string | Date;
  isActive: boolean;
};

function isOpen(d: Dept) {
  const now = Date.now();
  return (
    d.isActive &&
    now >= new Date(d.windowStart).getTime() &&
    now <= new Date(d.windowEnd).getTime()
  );
}

export default function DepartmentsList({ departments }: { departments: Dept[] }) {
  const handleSelect = async (slug: string, name: string) => {
    const r = await fetch("/api/me/departments/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      alert(`Selected ${name}`);
      location.reload();
    } else {
      alert(data?.error || "Failed to select department");
    }
  };

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <p className="text-sm text-neutral-600">
          No departments are open for selection right now.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {departments.map((d) => {
        const open = isOpen(d);
        return (
          <li
            key={d.slug}
            className="rounded-xl border bg-white p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-neutral-500">
                Window: {new Date(d.windowStart).toLocaleString()} →{" "}
                {new Date(d.windowEnd).toLocaleString()}{" "}
                <span
                  className={`ml-2 px-2 py-0.5 rounded ${
                    open
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {open ? "Open" : "Closed"}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleSelect(d.slug, d.name)}
              disabled={!open}
              className="px-3 py-2 rounded bg-black text-white disabled:opacity-40"
            >
              Select
            </button>
          </li>
        );
      })}
    </ul>
  );
}
