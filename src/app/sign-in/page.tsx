import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const notice = error === "callback"
    ? "That confirmation or password-reset link could not be verified. It may have expired or already been used. Request a fresh link and open it once."
    : error === "profile"
      ? "Your email is confirmed, but your Skulena profile could not be loaded. Your account and data have not been deleted; try signing in again shortly."
      : undefined;
  return <AuthShell eyebrow="Welcome back" title="Continue your school journey." description="Sign in to save schools and manage child profiles, or continue building your school’s profile."><AuthForm action={signInAction} mode="sign-in" notice={notice} /></AuthShell>;
}
