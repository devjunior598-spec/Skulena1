"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { roleHome } from "@/lib/auth";
import type { Role } from "@/types/domain";

export type AuthState = { error?: string; success?: string; resendEmail?: string };

type AuthFailure = { code?: string; status?: number };

function authErrorMessage(error: AuthFailure, operation: "sign-in" | "sign-up" | "resend" | "reset") {
  switch (error.code) {
    case "email_not_confirmed":
      return "Confirm your email using the link we sent before signing in. If it didn’t arrive, request a fresh link below.";
    case "email_address_not_authorized":
      return "The confirmation email could not be sent to this address. Email delivery needs to be configured for public sign-ups.";
    case "over_email_send_rate_limit":
      return "Skulena has temporarily reached its email sending limit. Please wait before requesting another message.";
    case "over_request_rate_limit":
      return "There have been too many attempts from this network. Please wait a few minutes and try again.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "New accounts are temporarily unavailable. Please try again later.";
    case "weak_password":
      return "Choose a stronger password that is not common or easy to guess.";
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return "This security link has expired or was already used. Request a fresh link and open it once.";
    default:
      if (error.status === 429) return "There have been too many attempts. Please wait a few minutes and try again.";
      if (operation === "sign-in") return "We couldn’t sign you in. Check your email and password, then try again.";
      if (operation === "sign-up") return "We couldn’t create your account right now. Please check your details and try again.";
      if (operation === "resend") return "We couldn’t send a new confirmation email right now. Please try again later.";
      return "We couldn’t update your password. Request a fresh reset link and try again.";
  }
}

function validationError(error: { issues: { message: string }[] }): AuthState {
  return { error: error.issues[0]?.message ?? "Check the form and try again." };
}

async function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall back to the verified request origin if configuration is malformed.
    }
  }
  const incoming = await headers();
  const origin = incoming.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      // Fall back to local development only when no usable origin is available.
    }
  }
  return "http://localhost:3000";
}

export async function signInAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error, "sign-in"), resendEmail: error.code === "email_not_confirmed" ? parsed.data.email : undefined };
  if (!data.user) return { error: "We couldn’t complete sign-in. Please try again." };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profileError || !profile) return { error: "Your password is correct, but your Skulena profile could not be loaded. Your account has not been deleted; please try again shortly." };
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
  if (error) return { error: authErrorMessage(error, "sign-up"), resendEmail: error.code === "over_email_send_rate_limit" ? parsed.data.email : undefined };
  if (!data.user) return { error: "We couldn’t confirm that your account was created. Please try again." };
  if (!data.session) return { success: "Check your inbox and spam folder for a confirmation link. Your account and profile are saved while you confirm your email.", resendEmail: parsed.data.email };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profileError || !profile) return { error: "Your account was created, but the Skulena profile could not be loaded yet. Please try signing in again shortly." };
  redirect(roleHome(profile.role as Role));
}

export async function resendConfirmationAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.pick({ email: true }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data.email, options: { emailRedirectTo: `${await appOrigin()}/auth/callback` } });
  if (error) return { error: authErrorMessage(error, "resend") };
  return { success: "If this address has a pending sign-up, a fresh confirmation link is on its way." };
}

export async function forgotPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${await appOrigin()}/auth/callback?next=/reset-password` });
  if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit" || error.status === 429)) {
    return { success: "If an account exists for that email, a reset link is being processed. Please wait before requesting another." };
  }
  return { success: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const supabase = await createClient();
  if (!supabase) return { error: "Account services are not configured on this environment yet." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error, "reset") };
  redirect("/sign-in?reset=success");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
