import { Database } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:mx-8">
      <div className="flex items-center gap-2 font-semibold">
        <Database className="h-4 w-4" />
        Neon setup required
      </div>
      <p className="mt-1 text-amber-800">
        Run <code>neon env pull</code>, then{" "}
        <code>node --env-file=.env.local scripts/migrate.mjs</code> to create
        and seed the database.
      </p>
    </div>
  );
}
