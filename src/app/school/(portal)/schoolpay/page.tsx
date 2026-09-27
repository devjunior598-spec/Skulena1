import { CircleDollarSign, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { getManagedSchool } from "@/lib/schools/managed-school";

export const metadata = { title: "SchoolPay" };

export default async function SchoolSchoolPayPage() {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <PageHeading title="SchoolPay" description="Select your school to see current participation availability." />;
  const { data: features, error } = await supabase.from("platform_features").select("feature_key, enabled").in("feature_key", ["schoolpay_public_visible", "schoolpay_school_enrollment_enabled", "schoolpay_financial_execution_enabled"]);
  const flags = new Map((features ?? []).map((item) => [item.feature_key, item.enabled]));
  const enrollmentAvailable = flags.get("schoolpay_public_visible") === true && flags.get("schoolpay_school_enrollment_enabled") === true && flags.get("schoolpay_financial_execution_enabled") === true;
  return <>
    <PageHeading eyebrow={school.name} title="SchoolPay" description="School-fee financing and school confirmations will be managed here only after the real provider and legal safeguards are configured." />
    <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" role="status"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-900"><CircleDollarSign className="size-5" /></span><div><p className="text-xs font-extrabold uppercase tracking-wide text-amber-900">{error ? "Availability could not be verified" : enrollmentAvailable ? "Enrollment may be enabled, but provider setup is incomplete" : "Not configured"}</p><h2 className="mt-1 text-lg font-extrabold text-amber-950">No funding or payment confirmation is active</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-amber-950">Skulena has no verified financing, identity, bank-data or settlement provider configured. This workspace does not have SchoolPay applications, school confirmations, disbursements or repayment records to show.</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">School participation</p><p className="mt-1 font-extrabold text-[#0e2946]">Not configured</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Provider-confirmed fee payments</p><p className="mt-1 font-extrabold text-[#0e2946]">None recorded</p></div></div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-950"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Your school’s admissions team can see admission invoices, but cannot see parent NIN/BVN, bank statements, income, credit data, underwriting notes or repayment problems.</p>
    </section>
  </>;
}
