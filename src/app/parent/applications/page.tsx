import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { PageHeading } from "@/components/portal/page-heading";
import { createClient } from "@/lib/supabase/server";
import { requireAccount } from "@/lib/auth";

const labels: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", received: "Received", under_review: "Under review",
  information_required: "Information requested", visit_required: "Visit requested", visit_scheduled: "Visit scheduled",
  assessment_required: "Assessment required", assessment_scheduled: "Assessment scheduled", interview_required: "Interview required",
  interview_scheduled: "Interview scheduled", decision_pending: "Decision pending", offered: "Offer received",
  accepted: "Offer accepted", declined: "Declined", withdrawn: "Withdrawn", cancelled: "Cancelled", enrolled: "Enrolled",
};

export default async function ParentApplicationsPage() {
  const { user } = await requireAccount(["parent"]);
  const supabase = await createClient();
  if (!supabase) return <PageHeading title="Applications" description="Your school applications will be kept here." />;
  const { data: applications, error } = await supabase.from("admission_applications")
    .select("id, application_number, school_id, child_id, class_name, academic_year, term, status, submitted_at, created_at")
    .eq("parent_id", user.id).order("created_at", { ascending: false });
  const schoolIds = [...new Set((applications ?? []).map((row) => row.school_id))];
  const childIds = [...new Set((applications ?? []).map((row) => row.child_id))];
  const [{ data: schools }, { data: children }] = await Promise.all([
    schoolIds.length ? supabase.from("public_school_profiles").select("id, slug, name").in("id", schoolIds) : Promise.resolve({ data: [] }),
    childIds.length ? supabase.from("children").select("id, first_name, last_name").in("id", childIds) : Promise.resolve({ data: [] }),
  ]);
  return <>
    <PageHeading eyebrow="Family workspace" title="Applications" description="Track each child’s application, messages, visits, documents, decisions and school invoice in one place." action={<Link href="/schools" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-extrabold text-white"><Plus className="size-4" />Find a school</Link>} />
    {error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">We couldn’t load your applications. Please refresh or try again.</p>}
    <div className="mt-7">{applications?.length ? <ul className="grid gap-3">{applications.map((application) => {
      const school = schools?.find((item) => item.id === application.school_id);
      const child = children?.find((item) => item.id === application.child_id);
      return <li key={application.id}><Link href={`/parent/applications/${application.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">{application.application_number}</p><h2 className="mt-2 truncate text-lg font-extrabold text-[#0e2946]">{school?.name ?? "School profile no longer available"}</h2><p className="mt-1 text-sm text-slate-600">{child ? `${child.first_name} ${child.last_name}` : "Child profile"} · {application.class_name} · {application.academic_year} · {application.term}</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold capitalize text-slate-700">{labels[application.status] ?? application.status.replaceAll("_", " ")}</span></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500"><span>{application.submitted_at ? `Submitted ${new Date(application.submitted_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : "Not submitted"}</span><span className="font-bold text-emerald-800">View application →</span></div>
      </Link></li>;
    })}</ul> : <EmptyState icon={ClipboardList} title="No applications yet" description="When you apply to a school through Skulena, you can return here to follow the real application status and conversation." />}</div>
  </>;
}
