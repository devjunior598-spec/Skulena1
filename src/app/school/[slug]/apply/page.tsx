import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { AdmissionApplicationWizard } from "@/components/parent/admission-application-wizard";
import { createAdmissionApplication } from "@/app/admissions/actions";
import { getPublicSchoolBySlug } from "@/lib/schools/public-schools";
import { createClient } from "@/lib/supabase/server";
import { requireAccount } from "@/lib/auth";

export const metadata = { title: "Apply for admission" };

export default async function ApplyToSchoolPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const [{ user, profile }, school, supabase] = await Promise.all([
    requireAccount(["parent"]), getPublicSchoolBySlug(slug), createClient(),
  ]);
  if (!school) notFound();
  if (!supabase) redirect("/parent/applications?error=database");
  const [{ data: settings }, { data: classes }, { data: children }, { data: questions }, { data: features }] = await Promise.all([
    supabase.from("school_admission_settings").select("academic_year, term, applications_enabled, opens_at, closes_at, instructions").eq("school_id", school.databaseId).maybeSingle(),
    supabase.from("school_classes").select("id, name, branch_id").eq("school_id", school.databaseId).eq("accepting_applications", true).order("name"),
    supabase.from("children").select("id, first_name, last_name, date_of_birth").eq("parent_id", user.id).order("created_at"),
    supabase.from("school_application_questions").select("id, prompt, answer_type, options, is_required").eq("school_id", school.databaseId).eq("is_active", true).order("sort_order"),
    supabase.from("platform_features").select("enabled").eq("feature_key", "admissions_enabled").maybeSingle(),
  ]);
  // This route checks intake windows against the request-time server clock.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const routeParams = searchParams ? await searchParams : {};
  const errorParam = Array.isArray(routeParams.error) ? routeParams.error[0] : routeParams.error;
  const errorMessages: Record<string, string> = {
    details: "Check the required child, class and guardian details, then try again.",
    consent: "Consent is required before you submit. You can still save a draft.",
    "not-open": "This school or class is no longer accepting applications through Skulena.",
    "class-branch": "The selected class is not available at that campus.",
    questions: "We couldn’t load the school’s application questions. Please refresh and try again.",
    answers: "Check the school question answers, then try again.",
    "required-question": "Answer every required school question before submitting.",
    duplicate: "An active application already exists for this child, class and intake.",
    save: "We couldn’t save the application. No submission was confirmed; please try again.",
    document: "One of the selected documents could not be securely uploaded. Check it is a PDF/JPG/PNG under 20 MB.",
  };
  const available = features?.enabled && school.admissionStatus === "open" && settings?.applications_enabled
    && Boolean(settings.academic_year && settings.term)
    && (!settings.opens_at || new Date(settings.opens_at).getTime() <= now)
    && (!settings.closes_at || new Date(settings.closes_at).getTime() >= now)
    && Boolean(classes?.length);

  return <div className="mx-auto max-w-4xl">
    <Link href={`/school/${encodeURIComponent(school.slug)}/admissions`} className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-emerald-800 hover:underline"><ArrowLeft className="size-4" />Back to admissions</Link>
    <div className="mt-5"><PageHeading eyebrow="Secure application" title={`Apply to ${school.name}`} description="Your child’s profile stays private. Only this school’s authorized admissions team can review the application you submit." /></div>
    {errorParam && errorMessages[errorParam] && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">{errorMessages[errorParam]}</p>}
    {!available ? <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5" role="status"><h2 className="font-extrabold text-amber-950">Applications are not open through Skulena right now</h2><p className="mt-2 text-sm leading-6 text-amber-900">This school has not enabled an open intake for an available class. You can review the school’s published contact details or return when applications open.</p><Link className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-amber-950 px-4 text-sm font-bold text-white" href={`/school/${encodeURIComponent(school.slug)}/admissions`}>View school admissions</Link></section>
      : !children?.length ? <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"><FilePlus2 className="size-6 text-emerald-800" /><h2 className="mt-4 text-xl font-extrabold text-[#0e2946]">Add a child profile first</h2><p className="mt-2 text-sm leading-6 text-slate-600">Skulena reuses the child profile you created, rather than asking you to re-enter the same details for every school. You can keep it private and add the minimum needed.</p><Link href="/parent/children" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-sm font-extrabold text-white">Go to child profiles</Link></section>
        : <AdmissionApplicationWizard action={createAdmissionApplication} schoolId={school.databaseId} schoolSlug={school.slug} schoolName={school.name}
          academicYear={settings.academic_year!} term={settings.term!} instructions={settings.instructions}
          childOptions={children} classes={classes ?? []} questions={questions ?? []}
          guardianName={profile.full_name} guardianEmail={user.email ?? ""} />}
  </div>;
}
