import { notFound } from "next/navigation";
import { CircleDollarSign, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "SchoolPay operations" };

export default async function SchoolPayOperationsPage() {
  const { profile } = await requireAccount(["admin", "super_admin"]);
  if (profile.role !== "admin" && profile.role !== "super_admin") notFound();
  const supabase = await createClient();
  const { data: flags, error } = supabase ? await supabase.from("platform_features").select("feature_key, enabled").in("feature_key", ["schoolpay_public_visible", "schoolpay_school_enrollment_enabled", "schoolpay_parent_applications_enabled", "schoolpay_financial_execution_enabled"]) : { data: null, error: true };
  const map = new Map((flags ?? []).map((item) => [item.feature_key, item.enabled]));
  const providers = ["Identity verification", "Bank-data access", "Credit bureau", "Financing decision", "Payment and settlement", "Debit mandate", "Electronic agreements", "Email notification"];
  return <>
    <PageHeading eyebrow="Restricted operations · admins only" title="SchoolPay operations" description="A truthful configuration and readiness page. No financial applications or provider results are fabricated." />
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><CircleDollarSign className="mt-1 size-5 shrink-0 text-amber-900" /><div><h2 className="font-extrabold text-amber-950">Financial execution is disabled</h2><p className="mt-1 text-sm leading-6 text-amber-950">No real financing, KYC, credit, bank-data or payment provider is connected. Do not enable execution through a UI switch; provider contracts, production credentials, webhook verification, reconciliation, legal review and restricted operational roles must be completed first.</p></div></div></section>
    {error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Feature status could not be read. This page fails closed.</p>}
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold text-[#0e2946]">Server-side feature flags</h2><dl className="mt-3 grid gap-3 sm:grid-cols-2">{[["Public information", "schoolpay_public_visible"], ["School enrollment", "schoolpay_school_enrollment_enabled"], ["Parent applications", "schoolpay_parent_applications_enabled"], ["Financial execution", "schoolpay_financial_execution_enabled"]].map(([label, key]) => <div key={key} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 font-extrabold text-[#0e2946]">{map.get(key) === true ? "Enabled" : "Disabled / unavailable"}</dd></div>)}</dl></section>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-800" /><h2 className="font-extrabold text-[#0e2946]">Provider readiness</h2></div><ul className="mt-3 grid gap-2 sm:grid-cols-2">{providers.map((provider) => <li key={provider} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"><span>{provider}</span><strong className="text-amber-900">Not configured</strong></li>)}</ul></section>
    <p className="mt-4 text-xs leading-5 text-slate-500">Restricted admin role is not equivalent to SchoolPay operations authorization. This build creates no access path to sensitive financial files or underwriting information.</p>
  </>;
}
