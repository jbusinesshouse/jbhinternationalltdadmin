"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Field, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { state, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "admin") router.replace(next);
  }, [state.status, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) setError(signInError.message);
  }

  const denied = state.status === "not_admin" ? state.reason : null;
  const apiError = state.status === "error" ? state.message : null;
  const alertMessage = error || denied || apiError;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field label="Email">
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@jbhinternationallimited.com"
          className="h-11"
          aria-invalid={Boolean(error)}
        />
      </Field>

      <Field label="Password">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-11"
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className={cn(
              "absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center",
              "rounded-[var(--radius)] text-muted-soft transition-colors",
              "hover:bg-surface-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            )}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </Field>

      {alertMessage && (
        <div
          className="rounded-xl border border-red-200/80 bg-danger-soft px-3.5 py-3 text-sm leading-relaxed text-danger"
          role="alert"
        >
          {alertMessage}
          {denied && (
            <button
              type="button"
              className="mt-2 block text-xs font-semibold underline underline-offset-2"
              onClick={() => void signOut()}
            >
              Sign out and use another account
            </button>
          )}
        </div>
      )}

      <Button type="submit" className="h-11 w-full text-[15px]" loading={submitting}>
        Sign in
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-soft">
        Access is limited to accounts on the admin allowlist.
      </p>
    </form>
  );
}
