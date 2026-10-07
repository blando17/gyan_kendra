import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";

import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

// One page, two modes. Signing up logs you straight in.
export default function AuthPage({ mode = "login" }) {
  const isSignup = mode === "signup";

  const { user, loading, login, signup } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50/40 dark:bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (user) return <Navigate to={location.state?.from || "/board"} replace />;

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);

    setError("");

    try {
      if (isSignup) {
        await signup(form);
      } else {
        await login({ email: form.email, password: form.password });
      }

      navigate(location.state?.from || "/board", { replace: true });
    } catch (err) {
      setError(
        errorMessage(err, isSignup ? "Could not create the account." : "Could not sign in."),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50/40 px-4 py-10 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 shadow-sticky">
            <BookOpen className="h-6 w-6 text-amber-950" />
          </span>

          <div>
            <h1 className="font-hand text-2xl text-gray-900 dark:text-gray-50">
              GyanKendra
            </h1>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your knowledge, pinned in one place.
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sticky dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {isSignup ? "Create your board" : "Welcome back"}
          </h2>

          {isSignup && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Name
              </label>

              <input
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-amber-900"
                value={form.username}
                onChange={set("username")}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Email
            </label>

            <input
              type="email"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-amber-900"
              value={form.email}
              onChange={set("email")}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Password
            </label>

            <input
              type="password"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-amber-900"
              value={form.password}
              onChange={set("password")}
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />

            {isSignup && (
              <p className="mt-1 text-xs text-gray-400">At least 6 characters.</p>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {isSignup ? "Already have an account? " : "New here? "}

            <button
              type="button"
              onClick={() => navigate(isSignup ? "/login" : "/signup")}
              className="font-semibold text-gray-900 underline dark:text-amber-300"
            >
              {isSignup ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
