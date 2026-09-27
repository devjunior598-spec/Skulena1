import { ArrowRight, BadgeCheck, Building2, FileCheck2, FileText, Image as ImageIcon, MapPin, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyHint, StatusPill, WorkspaceCard, WorkspaceFeedback, type WorkspaceSearchParams } from "@/components/school/workspace-ui";
import { DocumentUploader } from "@/components/school/document-uploader";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData } from "@/lib/schools/workspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verification" };
type PageProps = { searchParams?: WorkspaceSearchParams };

export default async function VerificationPage({ searchParams }: PageProps) {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <PageHeading eyebrow="Trust" title="Verification" description="Set up your school profile first to share documents for review." />;
  const data = await getSchoolWorkspaceData(supabase, school.id);
  const checklist = [
    { title: "School identity", kind: "identity", document: null, icon: Building2 },
    { title: "School registration", kind: "documents", document: "registration", icon: FileText },
    { title: "School location", kind: "location", document: "proof_of_address", icon: MapPin },
    { title: "Government approval or licence", kind: "documents", document: "government_approval", icon: FileCheck2 },
    { title: "Facilities", kind: "facilities", document: null, icon: ShieldCheck },
    { title: "Photos", kind: "media", document: null, icon: ImageIcon },
  ];
  const statusFor = (kind: string, document: string | null) => {
    const record = data.verification.find((item) => item.verification_type === kind);
    if (record?.status === "verified") return { label: "Verified", tone: "green" as const };
    if (record?.status === "rejected" || record?.status === "expired") return { label: "Needs update", tone: "red" as const };
    if (record?.status === "pending") return { label: "Under review", tone: "blue" as const };
    if (document && data.documents.some((item) => item.document_type === document)) return { label: "Submitted", tone: "blue" as const };
    return { label: "Not submitted", tone: "slate" as const };
  };
  const overall = data.verification.some((item) => item.status === "rejected" || item.status === "expired") ? "needs_update"
    : data.verification.some((item) => item.status === "verified") ? "verified"
      : data.verification.some((item) => item.status === "pending") ? "under_review"
        : data.documents.length ? "in_progress" : "not_started";
  return <>
    <WorkspaceFeedback searchParams={searchParams} />
    <PageHeading eyebrow="Trust & confidence" title="Verification" description="Build trust with parents by verifying important information about your school." />
    {data.error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">{data.error}</p>}
    <WorkspaceCard className="mt-6 bg-[linear-gradient(110deg,#f0f7f3,#f3f7fb)]"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white text-emerald-800 shadow-sm"><BadgeCheck className="size-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Overall status</p><div className="mt-1.5"><StatusPill value={overall} /></div></div></div><p className="max-w-xl text-sm leading-6 text-slate-600">A trust indicator is added only after Skulena reviews the relevant information. Uploading a document does not verify it automatically.</p></div></WorkspaceCard>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
      <WorkspaceCard><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-[#0e2946]">Verification checklist</h2><p className="mt-1 text-xs text-slate-500">See what has been sent and what still needs attention.</p></div><ShieldCheck className="size-5 text-emerald-700" /></div>
        <ul className="mt-4 divide-y divide-slate-100">{checklist.map(({ title, kind, document, icon: Icon }) => { const status = statusFor(kind, document); return <li key={title} className="flex min-h-14 items-center gap-3 py-2"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500"><Icon className="size-4" /></span><span className="min-w-0 flex-1 text-xs font-bold text-slate-700">{title}</span><StatusPill value={status.label} tone={status.tone} /></li>; })}</ul>
      </WorkspaceCard>
      <WorkspaceCard><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-[#0e2946]">Your submitted documents</h2><p className="mt-1 text-xs text-slate-500">Documents on file for your school.</p></div><FileText className="size-5 text-emerald-700" /></div>
        {data.documents.length ? <ul className="mt-4 divide-y divide-slate-100">{data.documents.map((doc) => <li key={doc.id} className="flex items-center gap-3 py-3"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#0e2946]">{doc.title}</span><span className="mt-0.5 block text-[11px] capitalize text-slate-500">{String(doc.document_type).replaceAll("_", " ")}</span></span><span className="text-[10px] font-semibold text-slate-400">{new Date(doc.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span></li>)}</ul> : <div className="mt-4"><EmptyHint icon={FileText} title="No documents submitted yet" description="Send a school registration or address document so our team can begin a review." action={<a href="#submit-document" className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50">Submit a document <ArrowRight className="size-3.5" /></a>} /></div>}
      </WorkspaceCard>
    </div>
    <div id="submit-document" className="mt-5 scroll-mt-24"><DocumentUploader schoolId={school.id} /></div>
    <WorkspaceCard className="mt-5"><h2 className="text-base font-extrabold text-[#0e2946]">How verification works</h2><ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{["Submit your documents", "Skulena reviews them", "We may contact you if anything needs clarification", "Verified information can receive a trust indicator"].map((text, index) => <li key={text} className="flex items-start gap-2.5"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-extrabold text-emerald-800">{index + 1}</span><span className="text-xs leading-5 text-slate-600">{text}</span></li>)}</ol></WorkspaceCard>
  </>;
}
