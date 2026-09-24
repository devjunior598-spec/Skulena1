import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() { return <AuthShell eyebrow="Welcome back" title="Continue your school journey." description="Sign in to save schools and manage child profiles, or continue building your school’s profile."><AuthForm action={signInAction} mode="sign-in" /></AuthShell>; }
