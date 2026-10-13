"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/app/actions/auth";

const fieldClass =
  "h-11 rounded-[9px] border border-line bg-white px-3 text-sm font-normal outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const SignupForm = ({ nextPath }: { nextPath: string }) => {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, null);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-label="Email"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          aria-label="Password"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          aria-label="Confirm password"
          className={fieldClass}
        />
      </label>
      {state?.error ? (
        <p role="alert" className="text-sm text-[#ba433d]">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p role="status" className="text-sm text-[#287a52]">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-11 rounded-[9px] bg-accent text-sm font-semibold text-white hover:bg-[#2448c6] disabled:opacity-60"
      >
        {pending ? "Please wait…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};
