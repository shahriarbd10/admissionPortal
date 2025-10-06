export default function ModeratorHome() {
  return (
    <div className="p-6 space-y-3">
      <div>Moderator Dashboard (protected)</div>
      <a className="inline-block rounded border px-3 py-1 text-sm" href="/staff/moderator/questions">
        Upload Question Set
      </a>
    </div>
  );
}
