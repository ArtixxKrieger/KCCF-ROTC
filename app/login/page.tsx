"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Configure Supabase environment variables first.");
      return;
    }

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMessage(error.message);
      else router.push("/dashboard");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) setMessage(error.message);
    else
      setMessage(
        "Account created. Check your email to confirm it, then sign in.",
      );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#101d35] text-[#d4b44c]">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-[#101d35]">
          KCCF Logistics Access
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500">
          Supabase authenticated operations
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Supabase is not configured. Add the environment variables first.
          </div>
        )}

        {mode === "sign-up" && (
          <label className="mt-5 block text-xs font-bold text-slate-600">
            Full name
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
            />
          </label>
        )}
        <label className="mt-5 block text-xs font-bold text-slate-600">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
          />
        </label>
        <label className="mt-4 block text-xs font-bold text-slate-600">
          Password
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal"
          />
        </label>

        {message && (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="mt-5 w-full rounded-md bg-[#101d35] px-4 py-3 text-sm font-bold text-white"
        >
          {mode === "sign-in" ? "Sign In" : "Create Account"}
        </button>
        <button
          type="button"
          onClick={() =>
            setMode((current) =>
              current === "sign-in" ? "sign-up" : "sign-in",
            )
          }
          className="mt-3 w-full text-xs font-bold text-[#1d3557]"
        >
          {mode === "sign-in"
            ? "Create a new account"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
