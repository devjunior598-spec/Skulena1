import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction } from "@/app/auth/actions";
export const metadata: Metadata = { title: "Choose a new password" };
export default function ResetPasswordPage() { return <AuthShell eyebrow="Account recovery" title="Choose a new password." description="Use a strong password you do not use elsewhere."><AuthForm action={resetPasswordAction} mode="reset" /></AuthShell>; }
