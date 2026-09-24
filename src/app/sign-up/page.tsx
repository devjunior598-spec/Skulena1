import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/app/auth/actions";
export const metadata: Metadata = { title: "Create an account" };
export default function SignUpPage() { return <AuthShell eyebrow="Join Skulena" title="One account, built for your role." description="Parents can keep a private shortlist and child profiles. School owners can create and manage an accurate school presence."><AuthForm action={signUpAction} mode="sign-up" /></AuthShell>; }
