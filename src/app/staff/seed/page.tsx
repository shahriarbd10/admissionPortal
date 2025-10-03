"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, KeyRound, ShieldPlus } from "lucide-react";

export default function SeedStaffPage() {
  const [securityKey, setSecurityKey] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MODERATOR">("ADMIN");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/users/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ securityKey, username, email, password, role }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed");
      setMsg({ ok: true, text: `Seeded ${data.role}. You can now login at /staff-login.` });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="rounded-2xl border bg-white/80 p-6 shadow backdrop-blur">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-semibold">
          <ShieldPlus className="h-6 w-6 text-indigo-600" />
          Seed Staff User
        </h1>
        <p className="mb-6 text-sm text-neutral-600">
          Protected by a one-time security key. Use it to create the first Admin/Moderator.
        </p>

        {msg && (
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
          >
            {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Security key</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Username (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email (optional)</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="ChangeMe123!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <div className="mt-1 flex gap-3">
              {(["ADMIN", "MODERATOR"] as const).map((r) => (
                <label key={r} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {busy ? "Seeding…" : "Seed user"}
          </button>

          <p className="mt-2 text-xs text-neutral-500">
            After seeding, go to <code>/staff-login</code> and sign in.
          </p>
        </form>
      </div>
    </main>
  );
}
