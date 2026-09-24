import Link from "next/link";
import { BadgeCheck, CalendarClock, Eye, FileText, MessageCircle } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyState } from "@/components/portal/empty-state";
import { Button } from "@/components/ui/button";
import { getManagedSchool } from "@/lib/schools/managed-school";

export default async function SchoolDashboardPage() {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <><PageHeading eyebrow="School dashboard" title="Create your school profile" description="Start a draft and return to it whenever you need." /><div className="mt-8"><EmptyState icon={FileText} title="No school draft yet" description="The guided setup takes you through the information families look for."><Button asChild><Link href="/for-schools/register">Start school profile</Link></Button></EmptyState></div></>;
  const [{ data: completion }, { data: verification }] = await Promise.all([
    supabase.rpc("school_profile_completion", { target_school_id: school.id }),
    supabase.from("verification_records").select("status, method, verification_type").eq("school_id", school.id).eq("status", "verified"),
  ]);
  const metrics = [{ label: "Profile views", value: "—", icon: Eye, note: "Analytics not enabled" }, { label: "Enquiries", value: "—", icon: MessageCircle, note: "Coming in a later phase" }, { label: "Applications", value: "—", icon: FileText, note: "Admissions workflow not enabled" }, { label: "Upcoming visits", value: "—", icon: CalendarClock, note: "Visit booking not enabled" }];
  return <><PageHeading eyebrow="School dashboard" title={school.name} description={`Your profile is ${completion ?? 0}% complete. Status: ${String(school.status).replaceAll("_", " ")}.`} action={<Button asChild><Link href="/for-schools/register">Continue profile</Link></Button>} />
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="h-3 bg-slate-100"><div className="h-full rounded-r-full bg-emerald-600" style={{ width: `${completion ?? 0}%` }} /></div><div className="p-5"><p className="text-2xl font-extrabold text-[#0e2946]">{completion ?? 0}% complete</p><p className="mt-1 text-sm text-slate-500">Calculated from your saved information across nine profile areas.</p></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, note }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="size-5 text-slate-500" /><p className="mt-5 text-3xl font-extrabold text-[#0e2946]">{value}</p><p className="mt-1 text-sm font-bold text-slate-700">{label}</p><p className="mt-2 text-xs leading-5 text-slate-500">{note}</p></article>)}</div>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><BadgeCheck className="size-5 text-emerald-700" /><h2 className="text-lg font-extrabold text-[#0e2946]">Verification status</h2></div>{verification?.length ? <ul className="mt-4 space-y-2">{verification.map((record) => <li key={`${record.verification_type}-${record.method}`} className="text-sm text-slate-600">{String(record.verification_type).replaceAll("_", " ")} · {String(record.method).replaceAll("_", " ")}</li>)}</ul> : <p className="mt-3 text-sm leading-6 text-slate-600">No checks have been verified yet. Publishing a profile does not award a verification badge.</p>}</section>
  </>;
}
