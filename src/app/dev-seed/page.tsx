"use client";

import { useState } from "react";

export default function DevSeedPage() {
  const [msg, setMsg] = useState("");

  const handleSeed = async () => {
    setMsg("Seeding...");
    const r = await fetch("/api/dev/seed/departments", { method: "POST" });
    const data = await r.json();
    if (r.ok) {
      setMsg(`Seeded ${data.count} departments ✅`);
    } else {
      setMsg(data.error || "Failed to seed");
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">Dev Seeder</h1>
      <button
        onClick={handleSeed}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Seed Departments
      </button>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </main>
  );
}
