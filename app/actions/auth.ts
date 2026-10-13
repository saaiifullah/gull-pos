"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readAdminNext } from "@/lib/safe-admin-path";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
} | null;

const readCredentials = (formData: FormData) => {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = readAdminNext(String(formData.get("next") ?? ""));

  if (!email.includes("@") || password.length < 6) {
    return {
      error: "Use a valid email and a password of at least 6 characters.",
    } as const;
  }

  return { email, password, nextPath } as const;
};

export const signIn = async (
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const credentials = readCredentials(formData);
  if ("error" in credentials) return { error: credentials.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) return { error: error.message };
  redirect(credentials.nextPath);
};

export const signUp = async (
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const credentials = readCredentials(formData);
  if ("error" in credentials) return { error: credentials.error };

  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (confirmPassword !== credentials.password) {
    return { error: "Passwords do not match." };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
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

  redirect(credentials.nextPath);
};

export const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};
