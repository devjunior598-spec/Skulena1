import Image from "next/image";
import { Check, ClipboardCheck, ExternalLink, Image as ImageIcon, MapPin, ShieldCheck, X } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { PageHeading } from "@/components/portal/page-heading";
import { Button } from "@/components/ui/button";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { changeSchoolReviewStatus, moderateSchoolLogo } from "./actions";

type SchoolBranch = {
  school_id: string;
  country: string;
  state: string | null;
  city: string | null;
  area: string | null;
  address_line: string | null;
  is_main: boolean;
};
type SchoolRelation = { school_id: string; levels?: unknown; curricula?: unknown; facilities?: unknown };
type SchoolMedia = {
  id: string;
  school_id: string;
  category: string;
  media_type: string;
  caption: string | null;
  moderation_status: string;
  storage_path: string;
};
type PendingSchoolLogo = {
  id: string;
  school_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
};
type LogoSchool = { id: string; name: string; slug: string; status: string };

const noticeMessages: Record<string, string> = {
  under_review: "The profile is now marked as under review.",
  published: "The school profile is published and visible in the directory.",
  rejected: "The profile is marked as changes needed. Contact the school separately with guidance.",
  logo_approved: "Logo approved. It will now appear on the school’s public card and profile.",
  logo_rejected: "Logo rejected and kept private. The school can upload a different image.",
};

const errorMessages: Record<string, string> = {
  read_only: "Your staff account can review profiles, but only a platform admin can change school publication status.",
  invalid_action: "That review action was invalid. Refresh the queue and try again.",
  confirmation_required: "Confirm the publication or rejection decision before continuing.",
  unavailable: "The review service is unavailable. Please try again shortly.",
  school_not_found: "That school is no longer available in the review queue.",
  already_changed: "This profile’s status changed. Refresh the queue before taking another action.",
  details_incomplete: "This profile is missing a required description, address, learning level, or curriculum. Ask the school to update and resubmit it before publishing.",
  update_failed: "We couldn’t update the school status. No change was made; please try again.",
  logo_invalid_action: "That logo review action was invalid. Refresh the queue and try again.",
  logo_unavailable: "The logo review service is unavailable. Please try again shortly.",
  logo_not_found: "That school logo is no longer available in the review queue.",
  logo_already_reviewed: "That logo has already been reviewed. Refresh the queue to see the latest status.",
  logo_update_failed: "We couldn’t update the logo decision. No change was made; please try again.",
};

function relationName(value: unknown): string | null {
  const relation = Array.isArray(value) ? value[0] : value;
  if (relation && typeof relation === "object" && "name" in relation && typeof relation.name === "string") return relation.name;
  return null;
}

function addToMap(map: Map<string, string[]>, key: string, value: string) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function statusLabel(status: string) {
  return status === "under_review" ? "Under review" : "Submitted";
}

function pretty(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not provided";
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const { profile } = await requireAccount(["inspector", "moderator", "admin", "super_admin"]);
  const canChangeSchoolStatus = profile.role === "admin" || profile.role === "super_admin";
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? noticeMessages[params.notice] : null;
  const errorNotice = typeof params.error === "string" ? errorMessages[params.error] : null;
  const supabase = await createClient();

  if (!supabase) {
    return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-950">The review service is unavailable. Please try again shortly.</section>;
  }

  const { data: schools, error: schoolsError } = await supabase
    .from("schools")
    .select("id, name, slug, short_name, school_type, year_established, description, public_email, public_phone, website_url, structure, gender, admission_status, admission_description, status, submitted_at")
    .in("status", ["submitted", "under_review"])
    .order("submitted_at", { ascending: true });

  const schoolRows = schools ?? [];
  const ids = schoolRows.map((school) => school.id);
  const [branchResult, levelResult, curriculumResult, facilityResult, feeResult, requirementResult, mediaResult] = ids.length ? await Promise.all([
    supabase.from("school_branches").select("school_id, country, state, city, area, address_line, is_main").in("school_id", ids),
    supabase.from("school_levels").select("school_id, levels(name, sort_order)").in("school_id", ids),
    supabase.from("school_curricula").select("school_id, curricula(name)").in("school_id", ids),
    supabase.from("school_facilities").select("school_id, facilities(name)").in("school_id", ids),
    supabase.from("school_fees").select("school_id, category, term, academic_year, amount").in("school_id", ids),
    supabase.from("school_admission_requirements").select("school_id, requirement").in("school_id", ids).order("sort_order"),
    supabase.from("school_media").select("id, school_id, category, media_type, caption, moderation_status, storage_path").in("school_id", ids).order("created_at", { ascending: false }),
  ]) : [
    { data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null },
    { data: [], error: null }, { data: [], error: null }, { data: [], error: null },
  ];

  const { data: pendingLogoData, error: pendingLogoError } = await supabase
    .from("school_media")
    .select("id, school_id, storage_path, caption, created_at")
    .ilike("category", "School logo")
    .eq("media_type", "image")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  const pendingLogos = (pendingLogoData ?? []) as PendingSchoolLogo[];
  const pendingLogoSchoolIds = [...new Set(pendingLogos.map((logo) => logo.school_id))];
  const { data: pendingSchoolData, error: pendingSchoolError } = pendingLogoSchoolIds.length
    ? await supabase.from("schools").select("id, name, slug, status").in("id", pendingLogoSchoolIds)
    : { data: [], error: null };
  const logoSchools = (pendingSchoolData ?? []) as LogoSchool[];
  const logoSchoolById = new Map(logoSchools.map((school) => [school.id, school]));

  const relationErrors = [branchResult.error, levelResult.error, curriculumResult.error, facilityResult.error, feeResult.error, requirementResult.error, mediaResult.error];
  const detailsUnavailable = relationErrors.some(Boolean);
  const branches = (branchResult.data ?? []) as SchoolBranch[];
  const branchBySchool = new Map<string, SchoolBranch>();
  for (const branch of branches) if (branch.is_main || !branchBySchool.has(branch.school_id)) branchBySchool.set(branch.school_id, branch);

  const levelNames = new Map<string, string[]>();
  for (const row of (levelResult.data ?? []) as SchoolRelation[]) {
    const name = relationName(row.levels);
    if (name) addToMap(levelNames, row.school_id, name);
  }
  const curriculumNames = new Map<string, string[]>();
  for (const row of (curriculumResult.data ?? []) as SchoolRelation[]) {
    const name = relationName(row.curricula);
    if (name) addToMap(curriculumNames, row.school_id, name);
  }
  const facilityNames = new Map<string, string[]>();
  for (const row of (facilityResult.data ?? []) as SchoolRelation[]) {
    const name = relationName(row.facilities);
    if (name) addToMap(facilityNames, row.school_id, name);
  }
  const fees = (feeResult.data ?? []) as Array<{ school_id: string; category: string; term: string | null; academic_year: string; amount: number | string }>;
  const requirements = (requirementResult.data ?? []) as Array<{ school_id: string; requirement: string }>;
  const media = (mediaResult.data ?? []) as SchoolMedia[];
  const mediaBySchool = new Map<string, SchoolMedia[]>();
  for (const item of media) {
    const items = mediaBySchool.get(item.school_id) ?? [];
    items.push(item);
    mediaBySchool.set(item.school_id, items);
  }

  const submittedCount = schoolRows.filter((school) => school.status === "submitted").length;
  const reviewCount = schoolRows.filter((school) => school.status === "under_review").length;
  const mediaPaths = [...new Set([...media.map((item) => item.storage_path), ...pendingLogos.map((item) => item.storage_path)])];
  const signedResult = mediaPaths.length ? await supabase.storage.from("school-media").createSignedUrls(mediaPaths, 600) : null;
  const signedUrls = new Map((signedResult?.data ?? []).flatMap((item) => item.signedUrl ? [[item.path, item.signedUrl] as [string, string]] : []));
  const mediaPreviewUnavailable = media.some((item) => !signedUrls.has(item.storage_path));
  const pendingLogoPreviewUnavailable = pendingLogos.some((item) => !signedUrls.has(item.storage_path));
  const canModerateLogos = profile.role === "moderator" || profile.role === "admin" || profile.role === "super_admin";

  return (
    <>
      <PageHeading
        eyebrow="Trust & safety"
        title="School review queue"
        description="Review the details families will see, then move each submission through a deliberate approval decision."
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Awaiting review</p><p className="mt-2 text-3xl font-extrabold text-[#0e2946]">{submittedCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">In review</p><p className="mt-2 text-3xl font-extrabold text-[#0e2946]">{reviewCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Logos awaiting review</p><p className="mt-2 text-3xl font-extrabold text-[#0e2946]">{pendingLogos.length}</p></div>
      </div>

      <div className="mt-5 space-y-3">
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</p>}
        {errorNotice && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">{errorNotice}</p>}
        {schoolsError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">We couldn’t load the review queue. Please refresh and try again.</p>}
        {detailsUnavailable && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">Some profile details could not be loaded. Do not make a publication decision until they are available.</p>}
        {(signedResult?.error || mediaPreviewUnavailable) && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">One or more media previews could not be prepared. Wait to make a decision until the uploaded files can be checked.</p>}
        {pendingLogoError || pendingSchoolError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">Pending school logos could not be loaded. Refresh the page before approving any logo.</p> : null}
        {pendingLogoPreviewUnavailable && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">One or more pending logos could not be previewed, so their approval controls are disabled.</p>}
      </div>

      <section aria-labelledby="logo-review-heading" className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="logo-review-heading" className="text-lg font-extrabold text-[#0e2946]">School logos awaiting review</h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">Approve a logo after checking it. Approved logos appear on the school card and public profile.</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">{pendingLogos.length} pending</span>
        </div>
        {pendingLogos.length ? <ul className="mt-4 divide-y divide-slate-100">
          {pendingLogos.map((logo) => {
            const school = logoSchoolById.get(logo.school_id);
            const signedUrl = signedUrls.get(logo.storage_path);
            const canAct = canModerateLogos && Boolean(signedUrl) && !pendingLogoError && !pendingSchoolError;
            return <li key={logo.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {signedUrl ? <Image src={signedUrl} alt={`${school?.name ?? "School"} logo pending review`} fill sizes="64px" className="object-contain p-1.5" /> : <ImageIcon className="size-6 text-slate-400" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-[#0e2946]">{school?.name ?? "School profile unavailable"}</p>
                <p className="mt-0.5 text-xs text-slate-500">{school ? `${pretty(school.status)} profile · ` : ""}Logo uploaded {new Date(logo.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}{logo.caption ? ` · ${logo.caption}` : ""}</p>
              </div>
              {signedUrl && <a href={signedUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-emerald-800 underline-offset-2 hover:underline">Preview full image <ExternalLink className="size-3.5" aria-hidden="true" /></a>}
              {canModerateLogos ? <div className="flex shrink-0 items-center gap-2">
                <form action={moderateSchoolLogo}>
                  <input type="hidden" name="mediaId" value={logo.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <Button size="sm" disabled={!canAct}><Check className="size-4" aria-hidden="true" />Approve</Button>
                </form>
                <form action={moderateSchoolLogo}>
                  <input type="hidden" name="mediaId" value={logo.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <Button size="sm" variant="outline" className="text-rose-800" disabled={!canAct}><X className="size-4" aria-hidden="true" />Reject</Button>
                </form>
              </div> : <span className="text-xs font-semibold text-slate-500">Trust staff only</span>}
            </li>;
          })}
        </ul> : <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">No school logos are waiting for review.</p>}
      </section>

      {!schoolsError && schoolRows.length === 0 ? (
        <div className="mt-7"><EmptyState icon={ClipboardCheck} title="No school submissions waiting" description="New profiles will appear here after a school owner submits them for review." /></div>
      ) : null}

      <div className="mt-7 space-y-5">
        {!schoolsError && schoolRows.map((school) => {
          const branch = branchBySchool.get(school.id);
          const location = [branch?.address_line, branch?.area, branch?.city, branch?.state, branch?.country].filter(Boolean).join(", ");
          const schoolMedia = mediaBySchool.get(school.id) ?? [];
          const schoolFees = fees.filter((fee) => fee.school_id === school.id);
          const schoolRequirements = requirements.filter((item) => item.school_id === school.id);
          const requiredDetailsComplete = Boolean(school.description?.trim() && branch?.address_line?.trim() && levelNames.get(school.id)?.length && curriculumNames.get(school.id)?.length);

          return (
            <article key={school.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${school.status === "under_review" ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-900"}`}>{statusLabel(school.status)}</span><span className="text-xs font-semibold text-slate-500">{school.submitted_at ? `Submitted ${new Date(school.submitted_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : "Submission date unavailable"}</span></div>
                  <h2 className="mt-3 break-words text-xl font-extrabold text-[#0e2946]">{school.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">/{school.slug} · {pretty(school.school_type)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"><ShieldCheck className="size-4 text-emerald-700" />Staff-only review</div>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-5">
                  <section><h3 className="text-sm font-extrabold text-[#0e2946]">School profile</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{school.description?.trim() || "No school description provided."}</p></section>
                  <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                    <div><dt className="font-bold text-slate-500"><MapPin className="mr-1 inline size-4" />Main campus</dt><dd className="mt-1 leading-6 text-slate-700">{location || "No main campus address provided."}</dd></div>
                    <div><dt className="font-bold text-slate-500">Learning levels</dt><dd className="mt-1 text-slate-700">{(levelNames.get(school.id) ?? []).join(", ") || "None provided"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Curriculum</dt><dd className="mt-1 text-slate-700">{(curriculumNames.get(school.id) ?? []).join(", ") || "None provided"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Structure & gender</dt><dd className="mt-1 text-slate-700">{pretty(school.structure)} · {pretty(school.gender)}</dd></div>
                    <div><dt className="font-bold text-slate-500">Public contact</dt><dd className="mt-1 break-words text-slate-700">{[school.public_email, school.public_phone].filter(Boolean).join(" · ") || "Not provided"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Website</dt><dd className="mt-1 break-words text-slate-700">{school.website_url || "Not provided"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Facilities</dt><dd className="mt-1 text-slate-700">{(facilityNames.get(school.id) ?? []).join(", ") || "None provided"}</dd></div>
                    <div><dt className="font-bold text-slate-500">Admissions</dt><dd className="mt-1 text-slate-700">{pretty(school.admission_status)}{school.admission_description ? ` · ${school.admission_description}` : ""}</dd></div>
                  </dl>
                  {schoolFees.length > 0 && <section><h3 className="text-sm font-extrabold text-[#0e2946]">Submitted fees</h3><ul className="mt-2 space-y-1 text-sm text-slate-600">{schoolFees.map((fee, index) => <li key={`${fee.category}-${fee.academic_year}-${index}`}>{pretty(fee.category)}{fee.term ? ` · ${pretty(fee.term)}` : ""} · ₦{Number(fee.amount).toLocaleString("en-NG")} · {fee.academic_year}</li>)}</ul></section>}
                  {schoolRequirements.length > 0 && <section><h3 className="text-sm font-extrabold text-[#0e2946]">Admission requirements</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">{schoolRequirements.map((item, index) => <li key={`${item.requirement}-${index}`}>{item.requirement}</li>)}</ul></section>}

                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0e2946]"><ImageIcon className="size-4" />Uploaded media</h3>
                    {schoolMedia.length ? <ul className="mt-3 space-y-2">{schoolMedia.map((item) => {
                      const signedUrl = signedUrls.get(item.storage_path);
                      return <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-slate-700">{item.category} · {pretty(item.media_type)} · {pretty(item.moderation_status)}{item.caption ? ` · ${item.caption}` : ""}</span>{signedUrl ? <a className="inline-flex items-center gap-1 font-bold text-emerald-800 underline-offset-2 hover:underline" href={signedUrl} target="_blank" rel="noreferrer">Preview <ExternalLink className="size-3.5" /></a> : <span className="text-xs text-slate-500">Preview unavailable</span>}</li>;
                    })}</ul> : <p className="mt-2 text-sm text-slate-500">No media has been uploaded.</p>}
                    <p className="mt-3 text-xs leading-5 text-slate-500">Publishing a school does not automatically approve its photos or logo; only separately approved media appears publicly.</p>
                  </section>
                </div>

                <aside className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-5">
                  <div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Review decision</p><p className="mt-2 text-sm leading-6 text-slate-600">Check the submitted details before changing the school’s visibility.</p></div>
                  {!requiredDetailsComplete && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950">This profile is missing one or more submission requirements and cannot be published.</p>}
                  {!canChangeSchoolStatus ? <p className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm leading-5 text-sky-950">Your staff role can review this profile. Only a platform admin can change its publication status.</p> : detailsUnavailable || signedResult?.error || mediaPreviewUnavailable ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950">Actions are disabled until the profile details and uploaded files can be checked.</p> : <div className="space-y-3">
                    {school.status === "submitted" && <form action={changeSchoolReviewStatus}><input type="hidden" name="schoolId" value={school.id} /><input type="hidden" name="status" value="under_review" /><Button className="w-full" variant="outline" size="sm"><ClipboardCheck className="size-4" />Start review</Button></form>}
                    <details className="rounded-xl border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-bold text-[#0e2946]">Make a final decision</summary>
                      <div className="mt-4 space-y-4">
                        {!requiredDetailsComplete ? <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">The school must complete all required details before publication.</p> : <form action={changeSchoolReviewStatus} className="space-y-3 rounded-lg bg-emerald-50 p-3"><input type="hidden" name="schoolId" value={school.id} /><input type="hidden" name="status" value="published" /><p className="text-xs leading-5 text-emerald-950">Publishing makes this school visible in the public directory.</p><label className="flex items-start gap-2 text-xs leading-5 text-emerald-950"><input className="mt-1" type="checkbox" name="confirm" value="yes" required />I have reviewed this profile and approve publication.</label><Button className="w-full" size="sm">Publish school</Button></form>}
                        <form action={changeSchoolReviewStatus} className="space-y-3 rounded-lg bg-rose-50 p-3"><input type="hidden" name="schoolId" value={school.id} /><input type="hidden" name="status" value="rejected" /><p className="text-xs leading-5 text-rose-950">This marks the profile as changes needed. Contact the school separately with feedback.</p><label className="flex items-start gap-2 text-xs leading-5 text-rose-950"><input className="mt-1" type="checkbox" name="confirm" value="yes" required />I confirm this profile should not be published yet.</label><Button className="w-full" variant="outline" size="sm">Request changes</Button></form>
                      </div>
                    </details>
                  </div>}
                </aside>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 rounded-xl bg-sky-50 p-4 text-xs leading-5 text-sky-950">School approval is separate from independent verification. Approval publishes the school-submitted profile; it does not certify the school’s claims. A rejection changes the profile status but does not send a message or email yet.</p>
    </>
  );
}
