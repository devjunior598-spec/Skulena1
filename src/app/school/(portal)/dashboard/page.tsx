import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenCheck, Building2, Check, CircleDollarSign, Clock3, ExternalLink, FileText, Images, MapPin, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyState } from "@/components/portal/empty-state";
import { WorkspaceCard, StatusPill, WorkspaceFeedback, type WorkspaceSearchParams } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData } from "@/lib/schools/workspace";
import { SCHOOL_LOGO_CATEGORY } from "@/types/domain";

type PageProps = { searchParams?: WorkspaceSearchParams };

function monthDate(value: string) { return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short" }); }

export default async function SchoolDashboardPage({ searchParams }: PageProps) {
  const { school, supabase, profile } = await getManagedSchool();
  if (!school) return <><PageHeading eyebrow="Your school" title="Set up your school profile" description="Add the details families look for, then keep everything up to date here." /><div className="mt-7"><EmptyState icon={FileText} title="Start with the basics" description="The guided setup helps you add your school's location, learning levels, facilities and admissions information."><Button asChild><Link href="/for-schools/register">Start school profile</Link></Button></EmptyState></div></>;
  const data = await getSchoolWorkspaceData(supabase, school.id);
  const [firstName] = profile.full_name.split(/\s+/).filter(Boolean);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const hasLogo = data.media.some((item) => item.category === SCHOOL_LOGO_CATEGORY && item.media_type === "image");
  const checklist = [
    { label: "Basic information", done: school.description !== null && school.description !== undefined && school.school_type !== null, href: "/school/profile" },
    { label: "Location", done: data.branches.some((branch) => branch.address_line !== null), href: "/school/profile#location" },
    { label: "School levels", done: data.levels.length > 0, href: "/school/profile#learning" },
    { label: "Curriculum", done: data.curricula.length > 0, href: "/school/profile#learning" },
    { label: "Facilities", done: data.facilities.length > 0, href: "/school/facilities" },
    { label: "Fees", done: data.fees.length > 0, href: "/school/fees" },
    { label: "School media", done: data.media.length > 0, href: "/school/media" },
    { label: "Admissions", done: school.admission_description !== null && school.admission_description !== undefined, href: "/school/admissions" },
    { label: "Verification documents", done: data.documents.length > 0, href: "/school/verification" },
  ];
  const percentage = Math.min(100, Math.max(0, data.completion));
  const incomplete = checklist.filter((item) => !item.done);
  const profileState: Record<string, { label: string; explanation: string; next: string }> = {
    draft: { label: "Draft", explanation: "Your profile is saved. Finish any missing details when you’re ready.", next: "Your school is not visible to families yet." },
    submitted: { label: "Submitted for review", explanation: "Your school is being reviewed. We’ll let you know when the review is complete.", next: "You can still improve your profile while you wait." },
    under_review: { label: "Under review", explanation: "Your school is being reviewed. We’ll let you know when the review is complete.", next: "You can still improve your profile while you wait." },
    published: { label: "Published", explanation: "Your school profile is live for families to discover.", next: "Preview the public page to make sure it looks right." },
    rejected: { label: "Needs attention", explanation: "Some details need an update before your profile can be published.", next: "Review your information and update anything that needs attention." },
    suspended: { label: "Suspended", explanation: "Your school profile is not currently visible to families.", next: "Check your verification page for updates from the Skulena team." },
  };
  const state = profileState[school.status] ?? profileState.draft;
  const attention = [...incomplete.map((item) => ({ title: item.label === "Verification documents" ? "Submit verification documents" : item.label === "School media" ? "Add photos or a school logo" : `Add ${item.label.toLowerCase()}`, href: item.href, icon: item.label === "Verification documents" ? ShieldCheck : item.label === "Fees" ? CircleDollarSign : item.label === "Facilities" ? Building2 : item.label === "Location" ? MapPin : Images })), ...(hasLogo ? [] : [{ title: "Add your school logo", href: "/school/media?category=School%20logo#upload-media", icon: Building2 }])].slice(0, 4);
  const activity = [
    ...data.media.slice(0, 4).map((item) => ({ label: `Photo or video added · ${item.category}`, date: item.created_at, href: "/school/media", icon: Images })),
    ...data.documents.slice(0, 3).map((item) => ({ label: `Document submitted · ${item.title}`, date: item.created_at, href: "/school/verification", icon: ShieldCheck })),
    ...(school.updated_at ? [{ label: "School profile updated", date: String(school.updated_at), href: "/school/profile", icon: Building2 }] : []),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const quickActions = [
    { label: "Edit profile", href: "/school/profile", icon: Building2 },
    { label: "Add photos", href: "/school/media", icon: Images },
    { label: "Update fees", href: "/school/fees", icon: CircleDollarSign },
    { label: "Manage admissions", href: "/school/admissions", icon: BookOpenCheck },
    { label: "Preview profile", href: "/school/preview", icon: ExternalLink },
  ];

  return <>
    <WorkspaceFeedback searchParams={searchParams} />
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-800">Your school workspace</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-[#0e2946] sm:text-4xl">{greeting}{firstName ? `, ${firstName}` : ""}</h1><p className="mt-2 text-sm text-slate-600">Here’s what’s happening with {school.name}.</p></div>
      <div className="flex items-center gap-2"><StatusPill value={school.status} /><Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/school/preview">Preview profile <ExternalLink className="size-4" /></Link></Button></div>
    </div>

    {data.error && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">{data.error}</p>}

    <section aria-label="Quick actions" className="mt-6 flex gap-2 overflow-x-auto pb-1">{quickActions.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Icon className="size-4 text-emerald-800" />{label}</Link>)}</section>

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.75fr)]">
      <WorkspaceCard className="p-0">
        <div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Your school profile</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0e2946]">{percentage}% <span className="text-base font-bold text-slate-500">complete</span></p></div><Button asChild variant="outline" size="sm"><Link href={incomplete[0]?.href ?? "/school/profile"}>Complete profile <ArrowRight className="size-4" /></Link></Button></div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="School profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${percentage}%` }} /></div>
          <p className="mt-3 text-xs leading-5 text-slate-500">This score is based on nine areas of information saved for your school.</p>
          <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2">{checklist.map((item) => <Link key={item.label} href={item.href} className="flex min-h-8 items-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-800"><span className={`grid size-5 shrink-0 place-items-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{item.done ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}</span><span>{item.label}</span></Link>)}</div>
        </div>
      </WorkspaceCard>

      <WorkspaceCard className="flex flex-col justify-between bg-[#102c49] text-white">
        <div><div className="flex items-center gap-2 text-emerald-200"><Sparkles className="size-4" /><p className="text-[10px] font-extrabold uppercase tracking-[.16em]">School visibility</p></div><div className="mt-4 flex items-center gap-2"><StatusPill value={school.status} /></div><h2 className="mt-4 text-xl font-extrabold">{school.status === "published" ? "Your school is visible" : school.status === "submitted" || school.status === "under_review" ? "Your school is being reviewed" : state.label}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{state.explanation}</p><p className="mt-3 text-xs leading-5 text-slate-300">{state.next}</p></div>
        <Button asChild className="mt-5 w-fit bg-white text-[#102c49] hover:bg-emerald-50"><Link href="/school/preview">Preview profile <ExternalLink className="size-4" /></Link></Button>
      </WorkspaceCard>
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <WorkspaceCard><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-[#0e2946]">Things to finish</h2><p className="mt-1 text-xs text-slate-500">A few helpful next steps for your profile.</p></div><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-800"><Clock3 className="size-4" /></span></div>
        {attention.length ? <ul className="mt-4 divide-y divide-slate-100">{attention.map(({ title, href, icon: Icon }) => <li key={`${title}-${href}`}><Link href={href} className="flex min-h-12 items-center gap-3 py-2 text-sm font-bold text-slate-700 hover:text-emerald-800"><Icon className="size-4 shrink-0 text-emerald-700" /><span className="flex-1">{title}</span><ArrowRight className="size-4 text-slate-400" /></Link></li>)}</ul> : <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Your profile information is complete. Keep it up to date as things change.</p>}
      </WorkspaceCard>
      <WorkspaceCard><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-[#0e2946]">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Updates to your school profile.</p></div><span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-800"><BadgeCheck className="size-4" /></span></div>
        {activity.length ? <ul className="mt-4 divide-y divide-slate-100">{activity.map(({ label, date, href, icon: Icon }, index) => <li key={`${label}-${date}`}><Link href={href} className="flex min-h-12 items-center gap-3 py-2"><span className={`grid size-8 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-500"}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">{label}</span><time className="shrink-0 text-[10px] font-semibold text-slate-400">{monthDate(date)}</time></Link></li>)}</ul> : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Your school updates will appear here as you add information, photos and documents.</p>}
      </WorkspaceCard>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {[{ label: "Photos & videos", value: data.media.length, href: "/school/media", icon: Images }, { label: "Verification documents", value: data.documents.length, href: "/school/verification", icon: ShieldCheck }, { label: "Classes", value: data.classes.length, href: "/school/admissions", icon: BookOpenCheck }].map(({ label, value, href, icon: Icon }) => <Link key={label} href={href} className="flex min-h-[86px] items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 transition hover:border-emerald-300 hover:shadow-sm"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-emerald-800"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-2xl font-extrabold text-[#0e2946]">{value}</span><span className="mt-0.5 block text-xs font-bold text-slate-500">{label}</span></span><ArrowRight className="size-4 text-slate-400" /></Link>)}
    </div>
  </>;
}
