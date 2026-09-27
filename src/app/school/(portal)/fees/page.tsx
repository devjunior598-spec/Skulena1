import { ArrowDownWideNarrow, CircleDollarSign, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyHint, WorkspaceCard, WorkspaceFeedback, type WorkspaceSearchParams } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData, schoolTypeLabel } from "@/lib/schools/workspace";
import { formatNaira } from "@/data/schools";
import { deleteFee, saveFee } from "@/app/school/(portal)/workspace-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fees" };
type PageProps = { searchParams?: WorkspaceSearchParams };
const feeCategories = ["tuition", "registration", "books", "uniform", "transport", "boarding", "other"];
function categoryLabel(fee: { category: string; custom_category?: string | null }) { return fee.category === "other" ? fee.custom_category || "Other" : schoolTypeLabel(fee.category); }

function FeeForm({ schoolId, fee, label = "Add fee" }: { schoolId: string; fee?: { id?: string; category?: string; custom_category?: string | null; amount?: number | string; term?: string | null; academic_year?: string; notes?: string | null }; label?: string }) {
  return <form action={saveFee} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-3">
    <input type="hidden" name="schoolId" value={schoolId} />{fee?.id && <input type="hidden" name="feeId" value={fee.id} />}
    <label className="text-xs font-bold text-slate-700">Fee type<select name="category" defaultValue={fee?.category ?? "tuition"} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{feeCategories.map((category) => <option key={category} value={category}>{schoolTypeLabel(category)}</option>)}</select></label>
    <label className="text-xs font-bold text-slate-700">Specific name <span className="font-medium text-slate-400">(if you chose Other)</span><input name="customCategory" maxLength={80} defaultValue={fee?.custom_category ?? ""} placeholder="e.g. Exam fee" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" /></label>
    <label className="text-xs font-bold text-slate-700">Amount (₦)<input name="amount" type="number" inputMode="decimal" min="0" step="0.01" required defaultValue={fee?.amount ?? ""} placeholder="e.g. 220000" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" /></label>
    <label className="text-xs font-bold text-slate-700">Academic year<input name="academicYear" required pattern="[0-9]{4}/[0-9]{4}" placeholder="2026/2027" defaultValue={fee?.academic_year ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" /></label>
    <label className="text-xs font-bold text-slate-700">Term or billing period<input name="term" maxLength={40} defaultValue={fee?.term ?? ""} placeholder="e.g. First term or per session" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" /></label>
    <label className="text-xs font-bold text-slate-700 sm:col-span-2">Notes for families <span className="font-medium text-slate-400">(optional)</span><input name="notes" maxLength={500} defaultValue={fee?.notes ?? ""} placeholder="What does this fee cover?" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" /></label>
    <div className="flex items-end sm:col-span-2 xl:col-span-3"><Button size="sm"><Plus className="size-4" />{label}</Button></div>
  </form>;
}

export default async function FeesPage({ searchParams }: PageProps) {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <PageHeading eyebrow="Your school" title="Fees" description="Set up your school profile first to add fee information." />;
  const data = await getSchoolWorkspaceData(supabase, school.id);
  const groups = new Map<string, typeof data.fees>();
  for (const fee of data.fees) {
    const key = fee.academic_year;
    groups.set(key, [...(groups.get(key) ?? []), fee]);
  }
  return <>
    <WorkspaceFeedback searchParams={searchParams} />
    <PageHeading eyebrow="Your school" title="Fees" description="Help parents understand the cost of attending your school." action={<a href="#new-fee" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white hover:bg-emerald-800"><Plus className="size-4" />Add fee</a>} />
    {data.error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">{data.error}</p>}
    <div id="new-fee" className="mt-5 scroll-mt-24"><details className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-sm font-extrabold text-[#0e2946] [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><CircleDollarSign className="size-5 text-emerald-700" />Add a fee</span><span className="text-xs text-emerald-800 group-open:hidden">Open form</span><span className="hidden text-xs text-slate-500 group-open:inline">Close</span></summary><p className="mt-1 text-xs text-slate-500">Add a fee for the right school year and term.</p><div className="mt-4"><FeeForm schoolId={school.id} /></div></details></div>
    {data.fees.length ? <div className="mt-5 space-y-5">{[...groups.entries()].map(([year, fees]) => <section key={year} aria-label={`Fees for ${year}`}><div className="mb-3 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-800"><ArrowDownWideNarrow className="size-4" /></span><h2 className="text-base font-extrabold text-[#0e2946]">{year}</h2><span className="text-xs font-semibold text-slate-400">{fees.length} {fees.length === 1 ? "fee" : "fees"}</span></div>
      <WorkspaceCard className="overflow-hidden p-0"><div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-4 bg-slate-50 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 md:grid"><span>Fee</span><span>Level / class</span><span>Term</span><span>Amount</span><span>Manage</span></div><div className="divide-y divide-slate-100">{fees.map((fee) => <article key={fee.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-center md:px-5"><div><p className="text-sm font-extrabold text-[#0e2946]">{categoryLabel(fee)}</p><p className="mt-1 text-[11px] text-slate-500">{fee.branch?.name ?? "All campuses"}</p></div><div className="text-xs font-semibold text-slate-600">{fee.schoolClass?.name || fee.level?.name || "All levels"}</div><div className="text-xs font-semibold text-slate-600">{fee.term || "Not specified"}</div><div className="text-base font-extrabold text-[#0e2946]">{formatNaira(Number(fee.amount))}</div><div className="flex flex-wrap items-center gap-1">
        <details className="relative"><summary aria-label={`Edit ${categoryLabel(fee)}`} className="grid size-9 cursor-pointer list-none place-items-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 [&::-webkit-details-marker]:hidden"><Pencil className="size-4" /></summary><div className="absolute right-0 z-20 mt-2 w-[min(90vw,650px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"><h3 className="mb-3 text-sm font-extrabold text-[#0e2946]">Edit {categoryLabel(fee)}</h3><FeeForm schoolId={school.id} fee={fee} label="Save fee" /></div></details>
        <details className="relative"><summary aria-label={`Duplicate ${categoryLabel(fee)}`} className="grid size-9 cursor-pointer list-none place-items-center rounded-lg text-slate-500 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"><Copy className="size-4" /></summary><div className="absolute right-0 z-20 mt-2 w-[min(90vw,650px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"><h3 className="mb-3 text-sm font-extrabold text-[#0e2946]">Duplicate fee</h3><FeeForm schoolId={school.id} fee={{ category: fee.category, custom_category: fee.custom_category, amount: Number(fee.amount), term: fee.term, academic_year: fee.academic_year, notes: fee.notes }} label="Add duplicate" /></div></details>
        <details className="relative"><summary aria-label={`Remove ${categoryLabel(fee)}`} className="grid size-9 cursor-pointer list-none place-items-center rounded-lg text-rose-600 hover:bg-rose-50 [&::-webkit-details-marker]:hidden"><Trash2 className="size-4" /></summary><form action={deleteFee} className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><input type="hidden" name="schoolId" value={school.id} /><input type="hidden" name="feeId" value={fee.id} /><p className="text-xs font-semibold text-slate-700">Remove {categoryLabel(fee)} from this year?</p><Button size="sm" variant="outline" className="mt-2 w-full border-rose-200 text-rose-700">Yes, remove</Button></form></details>
      </div>{fee.notes && <p className="text-xs leading-5 text-slate-500 md:col-span-5">{fee.notes}</p>}</article>)}</div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5"><span className="text-xs font-bold text-slate-600">Listed total for {year}</span><span className="text-sm font-extrabold text-[#0e2946]">{formatNaira(fees.reduce((total, fee) => total + Number(fee.amount), 0))}</span></div>
      </WorkspaceCard></section>)}</div> : <div className="mt-5"><EmptyHint icon={CircleDollarSign} title="No fees have been added yet" description="Add your fee information so parents can understand the expected cost and plan ahead." action={<a href="#new-fee" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3.5 text-xs font-extrabold text-white hover:bg-emerald-800"><Plus className="size-4" />Add fees</a>} /></div>}
    <p className="mt-4 text-xs leading-5 text-slate-500">Amounts are shown in Nigerian naira. Optional fees and one-time billing labels are not part of the current fee information form.</p>
  </>;
}
