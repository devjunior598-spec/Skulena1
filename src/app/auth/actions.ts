"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { roleHome } from "@/lib/auth";
import type { Role } from "@/types/domain";

export type AuthState = { error?: string; success?: string };

function validationError(error: { issues: { message: string }[] }): AuthState {
  return { error: error.issues[0]?.message ?? "Check the form and try again." };
}

async function appOrigin() {
  const incoming = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL || incoming.get("origin") || "http://localhost:3000";
}

export async function signInAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "The email or password is incorrect." };
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  redirect(roleHome((profile?.role as Role | undefined) ?? null));
}

export async function signUpAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({ fullName: formData.get("fullName"), email: formData.get("email"), password: formData.get("password"), accountType: formData.get("accountType") });
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${await appOrigin()}/auth/callback`, data: { full_name: parsed.data.fullName, account_type: parsed.data.accountType } },
  });
  if (error) return { error: error.message };
  if (!data.session) return { success: "Check your email to confirm your account, then return to sign in." };
  redirect(parsed.data.accountType === "parent" ? "/parent" : "/school/dashboard");
}

export async function forgotPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${await appOrigin()}/auth/callback?next=/reset-password` });
  return { success: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  redirect("/sign-in?reset=success");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
