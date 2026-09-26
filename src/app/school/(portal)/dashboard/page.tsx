import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Images,
  ShieldCheck,
} from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyState } from "@/components/portal/empty-state";
import { Button } from "@/components/ui/button";
import { getManagedSchool } from "@/lib/schools/managed-school";

const statusDetails: Record<string, { label: string; description: string; className: string; next: string; href: string; action: string }> = {
  draft: {
    label: "Draft",
    description: "Complete the key details and submit your profile for review.",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    next: "Your profile is saved as a draft. Continue where you left off, then submit it when it’s ready.",
    href: "/for-schools/register",
    action: "Continue setup",
  },
  submitted: {
    label: "Submitted",
    description: "Your profile has been sent to the Skulena team for review.",
    className: "bg-sky-50 text-sky-800 ring-sky-200",
    next: "Your profile is in the review queue. You can check your verification documents while you wait.",
    href: "/school/verification",
    action: "Review documents",
  },
  under_review: {
    label: "Under review",
    description: "The Skulena team is reviewing the information you submitted.",
    className: "bg-sky-50 text-sky-800 ring-sky-200",
    next: "Your profile is being reviewed. Check your verification documents and keep them up to date.",
    href: "/school/verification",
    action: "Review documents",
  },
  published: {
    label: "Published",
    description: "Your school profile is live for families to discover.",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    next: "Your profile is live. Preview the public page to make sure it looks right to families.",
    href: "",
    action: "View public profile",
  },
  rejected: {
    label: "Changes needed",
    description: "Your profile needs attention before it can be published.",
    className: "bg-rose-50 text-rose-800 ring-rose-200",
    next: "Review your saved profile details. If you need clarification about the review outcome, contact the Skulena team.",
    href: "/for-schools/register",
    action: "Review profile",
  },
  suspended: {
    label: "Suspended",
    description: "Your school profile is not currently visible to families.",
    className: "bg-rose-50 text-rose-800 ring-rose-200",
    next: "Review your verification documents and any status notice from the Skulena team for the steps to restore your profile.",
    href: "/school/verification",
    action: "Review documents",
  },
};

function readable(value: string) {
  return value.replaceAll("_", " ");
}

export default async function SchoolDashboardPage() {
  const { school, supabase } = await getManagedSchool();

  if (!school) {
    return (
      <>
        <PageHeading eyebrow="School dashboard" title="Create your school profile" description="Start a draft and return to it whenever you need." />
        <div className="mt-8">
          <EmptyState icon={FileText} title="No school draft yet" description="The guided setup takes you through the information families look for.">
            <Button asChild><Link href="/for-schools/register">Start school profile</Link></Button>
          </EmptyState>
        </div>
      </>
    );
  }

  const [{ data: completion }, { data: media }, { data: verification }] = await Promise.all([
    supabase.rpc("school_profile_completion", { target_school_id: school.id }),
    supabase.from("school_media").select("id, moderation_status").eq("school_id", school.id),
    supabase.from("verification_records").select("id, status").eq("school_id", school.id),
  ]);

  const percentage = Math.min(100, Math.max(0, Number(completion ?? 0)));
  const mediaItems = media ?? [];
  const verificationRecords = verification ?? [];
  const pendingMedia = mediaItems.filter((item) => item.moderation_status === "pending").length;
  const approvedMedia = mediaItems.filter((item) => item.moderation_status === "approved").length;
  const rejectedMedia = mediaItems.filter((item) => item.moderation_status === "rejected").length;
  const verifiedChecks = verificationRecords.filter((record) => record.status === "verified").length;
  const pendingChecks = verificationRecords.filter((record) => record.status === "pending").length;
  const profileStatus = statusDetails[school.status] ?? {
    label: readable(school.status),
    description: "Check your profile workspace for the latest status.",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    next: "Open your school workspace to review your profile and its current status.",
    href: "/school/profile",
    action: "Open profile",
  };
  const nextHref = school.status === "published" ? `/school/${school.slug}` : profileStatus.href;

  const cards = [
    {
      label: "Profile completion",
      value: `${percentage}%`,
      note: "Across nine profile areas",
      icon: Building2,
      href: "/for-schools/register",
    },
    {
      label: "Media library",
      value: String(mediaItems.length),
      note: `${pendingMedia} awaiting review · ${approvedMedia} approved${rejectedMedia ? ` · ${rejectedMedia} need attention` : ""}`,
      icon: Images,
      href: "/school/media",
    },
    {
      label: "Verified checks",
      value: String(verifiedChecks),
      note: `${pendingChecks} pending · ${verificationRecords.length} total records`,
      icon: ShieldCheck,
      href: "/school/verification",
    },
    {
      label: "Admissions",
      value: readable(school.admission_status),
      note: "Manage availability and requirements in school setup",
      icon: BookOpenCheck,
      href: "/for-schools/register",
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="School dashboard"
        title={school.name}
        description={profileStatus.description}
        action={
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold capitalize ring-1 ring-inset ${profileStatus.className}`}>
            {school.status === "published" ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
            {profileStatus.label}
          </span>
        }
      />

      <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="h-2 bg-slate-100"><div className="h-full rounded-r-full bg-emerald-600 transition-[width]" style={{ width: `${percentage}%` }} /></div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Profile readiness</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0e2946]">{percentage}% <span className="text-base font-bold text-slate-500">complete</span></p>
              </div>
              <Button asChild variant="outline"><Link href="/for-schools/register">Update profile <ArrowRight className="size-4" /></Link></Button>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">Your school profile is built from nine information areas, including location, learning details, facilities and admissions.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0e2946] p-6 text-white">
          <div className="flex items-center gap-2 text-emerald-200"><BadgeCheck className="size-5" /><p className="text-xs font-extrabold uppercase tracking-widest">Next step</p></div>
          <h2 className="mt-3 text-xl font-extrabold">{profileStatus.label}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">{profileStatus.next}</p>
          <Button asChild className="mt-5 bg-white text-[#0e2946] hover:bg-emerald-50">
            <Link href={nextHref}>{profileStatus.action}{school.status === "published" ? <ExternalLink className="size-4" /> : <ArrowRight className="size-4" />}</Link>
          </Button>
        </div>
      </section>

      <section aria-label="School profile overview" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, href }) => (
          <Link key={label} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm">
            <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="size-5" /></span><ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" /></div>
            <p className="mt-5 break-words text-2xl font-extrabold capitalize text-[#0e2946]">{value}</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
            <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{note}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
