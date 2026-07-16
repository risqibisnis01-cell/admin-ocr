"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  nextPath: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error || "Unable to sign in.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={submitting}>
      <div>
        <label htmlFor="password" className="mb-2 block font-body-sm text-body-sm font-semibold text-on-surface">
          Access password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
            maxLength={1024}
            disabled={submitting}
            aria-invalid={Boolean(error)}
            aria-describedby="password-help"
            className="input-control"
            placeholder="Your shared password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={submitting}
            className="icon-button absolute right-0 top-0 border-transparent bg-transparent shadow-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        <p
          id="password-help"
          role={error ? "alert" : undefined}
          className={`mt-2 min-h-[1lh] font-body-sm text-body-sm ${error ? "text-error" : "text-on-surface-variant"}`}
        >
          {error || "Use the password configured by the workspace administrator."}
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || password.length === 0}
        className="ui-button ui-button--primary w-full"
      >
        {submitting && (
          <span className="spinner" aria-hidden="true" />
        )}
        {submitting ? "Unlocking…" : "Unlock workspace"}
      </button>
    </form>
  );
}
