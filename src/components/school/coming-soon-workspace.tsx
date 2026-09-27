import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, MessageCircle } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { WorkspaceCard } from "@/components/school/workspace-ui";

export function ComingSoonWorkspace({ title, description, emptyTitle, emptyDescription, icon: Icon, stages }: {
  title: string; description: string; emptyTitle: string; emptyDescription: string; icon: LucideIcon; stages?: string[];
}) {
  return <>
    <PageHeading eyebrow="School workspace" title={title} description={description} />
    {stages && <div className="mt-5"><p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">Planned workflow</p><div className="flex gap-2 overflow-x-auto pb-1">{stages.map((stage, index) => <span key={stage} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200"><span className="grid size-5 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-500">{index + 1}</span>{stage}</span>)}</div></div>}
    <WorkspaceCard className="mt-5"><div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon className="size-6" /></span><div className="min-w-0 flex-1"><h2 className="text-base font-extrabold text-[#0e2946]">{emptyTitle}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{emptyDescription}</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Coming later</span></div>
      <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs leading-5 text-slate-600">This part of the workspace is being prepared. It will only show information once the matching family-facing feature is available—there are no sample records or simulated activity here.</p><Link href="/school/dashboard" className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-extrabold text-emerald-800 hover:underline">Back to dashboard <ArrowRight className="size-3.5" /></Link></div>
    </WorkspaceCard>
  </>;
}

export const futureWorkflows = {
  applications: ["New", "Reviewing", "Assessment", "Offer sent", "Accepted", "Declined"],
  visits: ["Upcoming", "Completed", "Cancelled"],
};

export const futureIcons = { applications: FileText, visits: CalendarDays, enquiries: MessageCircle, messages: MessageCircle };
