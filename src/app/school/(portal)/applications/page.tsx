import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { PageHeading } from "@/components/portal/page-heading";
import { getManagedSchool } from "@/lib/schools/managed-school";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Applications" };
type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
const statuses = ["submitted", "received", "under_review", "information_required", "visit_required", "assessment_required", "interview_required", "decision_pending", "offered", "accepted", "declined", "enrolled"];
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function ApplicationsPage({ searchParams }: Props) {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <PageHeading title="Applications" description="Select or create your school profile to manage admissions." />;
  const params = searchParams ? await searchParams : {};
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const searchParam = Array.isArray(params.q) ? params.q[0] : params.q;
  const selectedStatus = statuses.includes(statusParam ?? "") ? statusParam! : "";
  const search = (searchParam ?? "").trim().slice(0, 100);
  let query = supabase.from("admission_applications").select("id, application_number, parent_id, child_id, class_name, academic_year, term, status, submitted_at, created_at").eq("school_id", school.id).order("created_at", { ascending: false }).limit(250);
  if (selectedStatus) query = query.eq("status", selectedStatus);
  const { data: applications, error } = await query;
  const parentIds = [...new Set((applications ?? []).map((application) => application.parent_id))];
  const childIds = [...new Set((applications ?? []).map((application) => application.child_id))];
  const [{ data: parents }, { data: children }, { count: unreadCount }] = await Promise.all([
    parentIds.length ? supabase.from("profiles").select("id, full_name").in("id", parentIds) : Promise.resolve({ data: [] }),
    childIds.length ? supabase.from("children").select("id, first_name, last_name").in("id", childIds) : Promise.resolve({ data: [] }),
    supabase.from("admission_messages").select("id", { count: "exact", head: true }).eq("school_id", school.id),
  ]);
  const filtered = (applications ?? []).filter((application) => {
    if (!search) return true;
    const parent = parents?.find((item) => item.id === application.parent_id)?.full_name ?? "";
    const child = children?.find((item) => item.id === application.child_id);
    return [application.application_number, application.class_name, application.academic_year, parent, child?.first_name, child?.last_name].some((value) => value?.toLowerCase().includes(search.toLowerCase()));
  });

  return <>
    <PageHeading eyebrow={school.name} title="Admissions CRM" description="Review applications, follow the current stage, and keep every family conversation tied to its application." action={<Link href="/school/admissions/settings" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">Admissions setup</Link>} />
    <div className="mt-6 flex flex-wrap gap-2" aria-label="Application status filters"><Link href="/school/applications" className={`rounded-full px-3 py-2 text-xs font-bold ${!selectedStatus ? "bg-emerald-800 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>All</Link>{statuses.map((status) => <Link key={status} href={`/school/applications?status=${status}`} className={`rounded-full px-3 py-2 text-xs font-bold capitalize ${selectedStatus === status ? "bg-emerald-800 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>{label(status)}</Link>)}</div>
    <form className="mt-4 flex gap-2" role="search"><label htmlFor="application-search" className="sr-only">Search applications</label><div className="relative max-w-xl flex-1"><Search className="absolute left-3 top-3.5 size-4 text-slate-400" /><input id="application-search" name="q" defaultValue={search} placeholder="Reference, parent, child, class or academic year" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm" />{selectedStatus && <input type="hidden" name="status" value={selectedStatus} />}</div><button className="min-h-11 rounded-xl bg-[#0e2946] px-4 text-sm font-bold text-white">Search</button></form>
    {error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Applications could not be loaded. Check the admissions migration has been applied and try again.</p>}
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white">
      {filtered.length ? <div className="divide-y divide-slate-100">{filtered.map((application) => {
        const parent = parents?.find((item) => item.id === application.parent_id);
        const child = children?.find((item) => item.id === application.child_id);
        return <Link key={application.id} href={`/school/applications/${application.id}`} className="grid gap-2 p-4 hover:bg-emerald-50/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"><div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">{application.application_number}</p><h2 className="mt-1 truncate text-base font-extrabold text-[#0e2946]">{child ? `${child.first_name} ${child.last_name}` : "Child profile"} · {application.class_name}</h2><p className="mt-1 truncate text-sm text-slate-600">{parent?.full_name || "Parent"} · {application.academic_year} · {application.term}</p></div><div className="flex items-center gap-3 sm:justify-end"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-700">{label(application.status)}</span><span className="text-xs text-slate-500">{application.submitted_at ? new Date(application.submitted_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "Draft"}</span></div></Link>;
      })}</div> : <div className="p-6"><EmptyState icon={ClipboardList} title={search || selectedStatus ? "No applications match those filters" : "No applications yet"} description="Applications will appear here only after a parent submits one for this school. No sample records or estimated counts are shown." /></div>}
    </div>
    <p className="mt-3 text-xs text-slate-500">{filtered.length} application{filtered.length === 1 ? "" : "s"} in this view · {unreadCount ?? 0} message{unreadCount === 1 ? "" : "s"} across applications</p>
  </>;
}
