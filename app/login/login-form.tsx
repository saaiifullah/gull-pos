"use client";

import { useActionState } from "react";
import { authenticate, type AuthState } from "@/app/actions/auth";

export const LoginForm = ({ nextPath }: { nextPath: string }) => {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    authenticate,
    null,
  );

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
          className="h-11 rounded-[9px] border border-line bg-white px-3 text-sm font-normal outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          aria-label="Password"
          className="h-11 rounded-[9px] border border-line bg-white px-3 text-sm font-normal outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          name="intent"
          value="sign-in"
          disabled={pending}
          className="h-11 flex-1 rounded-[9px] bg-accent text-sm font-semibold text-white hover:bg-[#2448c6] disabled:opacity-60"
        >
          {pending ? "Please wait…" : "Sign in"}
        </button>
        <button
          type="submit"
          name="intent"
          value="sign-up"
          disabled={pending}
          className="h-11 flex-1 rounded-[9px] border border-line bg-white text-sm font-semibold text-ink disabled:opacity-60"
        >
          Create account
        </button>
      </div>
    </form>
  );
};
