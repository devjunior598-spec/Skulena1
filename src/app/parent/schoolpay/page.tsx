import { CircleDollarSign, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "SchoolPay" };

export default async function ParentSchoolPayPage() {
  await requireAccount(["parent"]);
  const supabase = await createClient();
  const { data: features, error } = supabase ? await supabase.from("platform_features").select("feature_key, enabled").in("feature_key", ["schoolpay_public_visible", "schoolpay_parent_applications_enabled", "schoolpay_financial_execution_enabled"]) : { data: null, error: true };
  const flags = new Map((features ?? []).map((item) => [item.feature_key, item.enabled]));
  const publicVisible = flags.get("schoolpay_public_visible") === true;
  const applicationEnabled = flags.get("schoolpay_parent_applications_enabled") === true;
  const executionEnabled = flags.get("schoolpay_financial_execution_enabled") === true;
  const available = !error && publicVisible && applicationEnabled && executionEnabled;
  return <>
    <PageHeading eyebrow="Family workspace" title="SchoolPay" description="A clear place for school-fee financing information when Skulena has verified providers and the required safeguards in place." />
    <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" role="status"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-900"><CircleDollarSign className="size-5" /></span><div><p className="text-xs font-extrabold uppercase tracking-wide text-amber-900">{available ? "Applications are not available for any account yet" : "Not configured"}</p><h2 className="mt-1 text-lg font-extrabold text-amber-950">No financing, identity check or repayment is active</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-amber-950">{error ? "We couldn’t verify SchoolPay availability. For your protection, this feature remains unavailable." : publicVisible ? "SchoolPay information may be visible, but parents cannot start a financial application until a real authorized financing provider, identity/bank-data providers, approved legal terms and secure operations are configured." : "Skulena has not enabled SchoolPay for parents. This is not an approval or rejection, and no money has been requested or moved."}</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Provider state</p><p className="mt-1 font-extrabold text-[#0e2946]">Not configured</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Your SchoolPay application</p><p className="mt-1 font-extrabold text-[#0e2946]">None — applications are disabled</p></div></div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-950"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Do not send NIN, BVN, bank statements or financial documents through admissions messages. SchoolPay financial files are not collected in this workspace.</p>
    </section>
  </>;
}
