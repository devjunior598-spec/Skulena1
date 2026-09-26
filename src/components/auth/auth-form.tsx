"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendConfirmationAction, type AuthState } from "@/app/auth/actions";

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;
const inputClass = "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-[#0e2946] shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button size="lg" className="mt-2 w-full" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Please wait…" : children}<ArrowRight className="size-4" /></Button>;
}

export function AuthForm({ action, mode, notice }: { action: AuthAction; mode: "sign-in" | "sign-up" | "forgot" | "reset"; notice?: string }) {
  const [state, formAction] = useActionState(action, {});
  const [resendState, resendFormAction] = useActionState(resendConfirmationAction, {});
  return <>
    <form action={formAction} className="space-y-5" noValidate>
    {notice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{notice}</p>}
    {mode === "sign-up" && <>
      <label className="block text-sm font-bold text-slate-700">Full name<input name="fullName" autoComplete="name" className={inputClass} required /></label>
      <fieldset><legend className="text-sm font-bold text-slate-700">I’m joining as</legend><div className="mt-2 grid grid-cols-2 gap-3">
        <label className="cursor-pointer rounded-xl border border-slate-200 p-4 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"><input type="radio" name="accountType" value="parent" defaultChecked className="mr-2 accent-emerald-700" />Parent</label>
        <label className="cursor-pointer rounded-xl border border-slate-200 p-4 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"><input type="radio" name="accountType" value="school_owner" className="mr-2 accent-emerald-700" />School</label>
      </div></fieldset>
    </>}
    {mode !== "reset" && <label className="block text-sm font-bold text-slate-700">Email address<input name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={inputClass} required /></label>}
    {(mode === "sign-in" || mode === "sign-up" || mode === "reset") && <label className="block text-sm font-bold text-slate-700">{mode === "reset" ? "New password" : "Password"}<input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className={inputClass} minLength={8} required /><span className="mt-1.5 block text-xs font-medium text-slate-500">Use at least 8 characters.</span></label>}
    {mode === "reset" && <label className="block text-sm font-bold text-slate-700">Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" className={inputClass} minLength={8} required /></label>}
    {state.error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{state.success}</p>}
    <SubmitButton>{mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</SubmitButton>
    {mode === "sign-in" && <div className="flex flex-wrap justify-between gap-3 text-sm font-semibold"><Link href="/forgot-password" className="text-emerald-700 hover:underline">Forgot password?</Link><Link href="/sign-up" className="text-emerald-700 hover:underline">Create an account</Link></div>}
    {mode !== "sign-in" && <p className="text-center text-sm text-slate-600">Already have an account? <Link href="/sign-in" className="font-bold text-emerald-700 hover:underline">Sign in</Link></p>}
    </form>
    {state.resendEmail && <form action={resendFormAction} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="email" value={state.resendEmail} />
      {resendState.error && <p role="alert" className="text-sm font-semibold text-rose-800">{resendState.error}</p>}
      {resendState.success && <p role="status" className="text-sm font-semibold text-emerald-800">{resendState.success}</p>}
      <Button type="submit" variant="outline" size="sm">Resend confirmation email</Button>
    </form>}
  </>;
}
