import type { LucideIcon } from "lucide-react";

export function WorkspaceCard({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-28px_rgba(15,41,70,.35)] sm:p-6 ${className}`}>{children}</section>;
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-extrabold tracking-tight text-[#0e2946]">{title}</h2>{description && <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-500">{description}</p>}</div>{action}</div>;
}

export function StatusPill({ value, tone }: { value: string; tone?: "green" | "blue" | "amber" | "red" | "slate" }) {
  const chosen = tone ?? (value === "published" || value === "verified" || value === "open" ? "green" : value === "submitted" || value === "under_review" || value === "in_progress" || value === "pending" || value === "opening_soon" ? "blue" : value === "rejected" || value === "needs_update" || value === "suspended" ? "red" : value === "draft" || value === "closed" ? "amber" : "slate");
  const colors = { green: "bg-emerald-50 text-emerald-800 ring-emerald-200", blue: "bg-sky-50 text-sky-800 ring-sky-200", amber: "bg-amber-50 text-amber-900 ring-amber-200", red: "bg-rose-50 text-rose-800 ring-rose-200", slate: "bg-slate-100 text-slate-700 ring-slate-200" };
  const labels: Record<string, string> = { submitted: "Submitted for review", under_review: "Under review", published: "Published", rejected: "Needs attention", suspended: "Suspended", draft: "Draft", pending: "Under review", approved: "Verified", verified: "Verified", open: "Open", closed: "Closed", opening_soon: "Opening soon", in_progress: "In progress", not_started: "Not started", needs_update: "Needs attention", "not submitted": "Not submitted", "needs update": "Needs update" };
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${colors[chosen]}`}>{labels[value] ?? value.replaceAll("_", " ")}</span>;
}

export type WorkspaceSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function WorkspaceFeedback({ searchParams }: { searchParams?: WorkspaceSearchParams }) {
  return <FeedbackContent searchParams={searchParams} />;
}

async function FeedbackContent({ searchParams }: { searchParams?: WorkspaceSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const value = (entry: string | string[] | undefined) => Array.isArray(entry) ? entry[0] : entry;
  const saved = value(params.saved);
  const error = value(params.error);
  const savedLabels: Record<string, string> = { profile: "Your school profile has been updated.", admissions: "Your admissions information has been saved.", facility: "Facility added to your school profile.", "facility-removed": "Facility removed from your school profile.", fee: "Fee information saved.", "fee-removed": "Fee removed from your school profile.", media: "Your photo or video details were updated.", "media-removed": "Photo or video removed from your school profile.", cover: "Your cover photo has been updated.", reply: "Your reply has been saved." };
  const errorLabels: Record<string, string> = { school: "We couldn’t find the school profile to update.", permission: "You don’t have permission to make this change.", about: "Check the school name, school type and year, then try again.", contact: "Check the email address, phone number and website link.", location: "Check the campus location details and try again.", structure: "Choose a valid school structure and student group.", learning: "Choose from the available levels and curriculum options, then try again.", details: "Check the required fields and try again.", "fee-details": "Enter a valid amount and consecutive school years, such as 2026/2027.", duplicate: "That facility is already listed for this campus.", cover: "Only an approved school photo can be set as your cover. Please refresh and try again.", save: "We couldn’t save that change. Please try again." };
  if (saved && savedLabels[saved]) return <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{savedLabels[saved]}</p>;
  if (error && errorLabels[error]) return <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">{errorLabels[error]}</p>;
  return null;
}

export function Detail({ label, value, icon: Icon, href }: { label: string; value?: string | null; icon?: LucideIcon; href?: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 px-3.5 py-3"><dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{Icon && <Icon className="size-3.5 text-slate-400" aria-hidden="true" />}{label}</dt><dd className="mt-1.5 break-words text-sm font-bold text-[#0e2946]">{value || <span className="font-medium text-slate-400">Not added yet</span>}{href && <a className="ml-2 text-xs font-extrabold text-emerald-800 underline-offset-2 hover:underline" href={href}>Add</a>}</dd></div>;
}

export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{children}</a>;
}

export function EmptyHint({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-start gap-3 rounded-xl bg-[#f7faf9] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-800 shadow-sm"><Icon className="size-5" /></span><div><h3 className="text-sm font-extrabold text-[#0e2946]">{title}</h3><p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">{description}</p></div></div>{action}</div>;
}
