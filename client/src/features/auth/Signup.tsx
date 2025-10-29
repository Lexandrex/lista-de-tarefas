import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo]   = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || null },
        emailRedirectTo: `${window.location.origin}/auth/resetPassword`,
      },
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      nav("/");
    } else {
      setInfo("Check your email to confirm your account.");
    }
  }

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Create account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm">Full name (optional)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </label>
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              className="mt-1 w-full rounded border p-2"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm">Password</span>
            <input
              className="mt-1 w-full rounded border p-2"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm">Confirm password</span>
            <input
              className="mt-1 w-full rounded border p-2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info  && <p className="text-sm text-green-700">{info}</p>}

          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Sign up"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <span>Already have an account? </span>
          <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </div>
    </div>
  </div>
  );
}
