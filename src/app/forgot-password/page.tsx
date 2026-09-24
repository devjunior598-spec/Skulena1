import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "@/app/auth/actions";
export const metadata: Metadata = { title: "Forgot password" };
export default function ForgotPasswordPage() { return <AuthShell eyebrow="Account recovery" title="Reset your password." description="Enter your account email. We’ll send a secure reset link if it matches an account."><AuthForm action={forgotPasswordAction} mode="forgot" /></AuthShell>; }
