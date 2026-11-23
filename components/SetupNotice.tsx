import { Database } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:mx-8">
      <div className="flex items-center gap-2 font-semibold">
        <Database className="h-4 w-4" />
        Supabase setup required
      </div>
      <p className="mt-1 text-amber-800">
        Copy <code>.env.local.example</code> to <code>.env.local</code>, add
        your credentials, then run <code>supabase/schema.sql</code> and{" "}
        <code>supabase/seed.sql</code>.
      </p>
    </div>
  );
}
