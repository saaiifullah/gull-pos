"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
} | null;

const safeAdminPath = (value: FormDataEntryValue | null) => {
  const nextPath = String(value ?? "");
  if (nextPath === "/admin" || nextPath.startsWith("/admin/")) return nextPath;
  return "/admin";
};

export const authenticate = async (
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const intent = String(formData.get("intent") ?? "sign-in");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = safeAdminPath(formData.get("next"));

  if (!email.includes("@") || password.length < 6) {
    return {
      error: "Use a valid email and a password of at least 6 characters.",
    };
  }

  const supabase = await createClient();

  if (intent === "sign-up") {
    const headerStore = await headers();
    const origin = headerStore.get("origin") ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) return { error: error.message };
    if (!data.session) {
      return {
        message: "Check your email to confirm this account, then sign in.",
      };
    }

    redirect(nextPath);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(nextPath);
};

export const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};
