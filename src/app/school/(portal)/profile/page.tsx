import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Globe2, Mail, MapPin, Pencil, Phone, School, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/portal/page-heading";
import { Detail, SectionTitle, StatusPill, WorkspaceCard, WorkspaceFeedback, type WorkspaceSearchParams } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData, schoolCoverAndLogo, schoolTypeLabel } from "@/lib/schools/workspace";
import { saveLearningDetails, saveSchoolSection } from "@/app/school/(portal)/workspace-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "School profile" };
type PageProps = { searchParams?: WorkspaceSearchParams };

function EditDetails({ children, label = "Edit" }: { children: React.ReactNode; label?: string }) {
  return <details className="group"><summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 [&::-webkit-details-marker]:hidden"><Pencil className="size-3.5" />{label}</summary><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">{children}</div></details>;
}

function Input({ label, name, value, type = "text", placeholder }: { label: string; name: string; value?: string | number | null; type?: string; placeholder?: string }) {
  return <label className="block text-xs font-bold text-slate-700">{label}<input name={name} type={type} defaultValue={value ?? ""} placeholder={placeholder} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>;
}

export default async function SchoolProfilePage({ searchParams }: PageProps) {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <><PageHeading eyebrow="Your school" title="School profile" description="Set up your school's information for families." /><div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Your school profile has not been started yet.</p><Button asChild className="mt-4"><Link href="/for-schools/register">Start school setup</Link></Button></div></>;
  const [data, { data: allLevels }, { data: allCurricula }] = await Promise.all([
    getSchoolWorkspaceData(supabase, school.id),
    supabase.from("levels").select("id, code, name, sort_order").order("sort_order"),
    supabase.from("curricula").select("id, code, name").order("name"),
  ]);
  const { logo, cover } = schoolCoverAndLogo(data.media);
  const locationParts = [data.mainBranch?.area, data.mainBranch?.city, data.mainBranch?.state].filter(Boolean);
  const verifiedCount = data.verification.filter((item) => item.status === "verified").length;
  const schoolId = school.id;

  return <>
    <WorkspaceFeedback searchParams={searchParams} />
    <PageHeading eyebrow="Your school" title="School profile" description="Keep the information families see about your school accurate and up to date." action={<div className="flex gap-2"><Button asChild variant="outline" size="sm"><Link href="/school/preview">Preview profile <ArrowRight className="size-4" /></Link></Button><Button asChild size="sm"><Link href="/for-schools/register">Guided setup</Link></Button></div>} />
    {data.error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">{data.error}</p>}

    <section aria-label="School profile preview" className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="relative h-36 bg-[linear-gradient(115deg,#dceee5,#e9f1f6_60%,#d8e6ef)] sm:h-48">{cover ? <Image src={cover} alt={`${school.name} school cover`} fill unoptimized className="object-cover" sizes="100vw" /> : <div className="absolute inset-0 flex items-end p-4 sm:p-5"><Link href="/school/media?category=Campus#upload-media" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/90 px-3 text-xs font-extrabold text-emerald-900 shadow-sm backdrop-blur"><Building2 className="size-4" />Add cover photo</Link></div>}</div>
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-5 sm:px-6">
        <div className="-mt-8 flex min-w-0 items-end gap-3 sm:-mt-10 sm:gap-4"><div className="grid size-[76px] shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm sm:size-[92px]">{logo ? <Image src={logo} alt={`${school.name} logo`} width={92} height={92} unoptimized className="size-full object-contain p-1" /> : <Link href="/school/media?category=School%20logo#upload-media" aria-label="Add school logo" className="grid size-full place-items-center bg-emerald-50 text-emerald-800"><Building2 className="size-8" /></Link>}</div><div className="min-w-0 pb-1"><h2 className="truncate text-xl font-extrabold tracking-tight text-[#0e2946] sm:text-2xl">{school.name}</h2><p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin className="size-3.5 shrink-0" />{locationParts.join(", ") || "Location not added yet"}</p>{!logo && <Link href="/school/media?category=School%20logo#upload-media" className="mt-1 inline-flex min-h-8 items-center gap-1 text-[11px] font-extrabold text-emerald-800 hover:underline">Add school logo <ArrowRight className="size-3" /></Link>}</div></div>
        <div className="flex flex-wrap items-center gap-2"><StatusPill value={school.status} /><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-700"><ShieldCheck className="size-3.5 text-emerald-700" />{verifiedCount ? `${verifiedCount} verified` : "Not verified yet"}</span></div>
      </div>
    </section>

    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <WorkspaceCard id="about">
        <SectionTitle title="About your school" description="A clear introduction helps parents understand your approach." action={<EditDetails><form action={saveSchoolSection} className="space-y-3"><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="section" value="about" /><Input label="School name" name="name" value={school.name} /><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-slate-700">School type<select name="schoolType" defaultValue={String(school.school_type ?? "private")} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="private">Private</option><option value="public">Public</option><option value="faith_based">Faith-based</option><option value="international">International</option><option value="other">Other</option></select></label><Input label="Year established" name="yearEstablished" type="number" value={school.year_established as number | null} /></div><label className="block text-xs font-bold text-slate-700">About your school<textarea name="description" defaultValue={String(school.description ?? "")} rows={4} maxLength={4000} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label><Button size="sm">Save changes</Button></form></EditDetails>} />
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{String(school.description ?? "") || "Add a short introduction to tell families what makes your school a good fit."}</p><dl className="mt-4 grid grid-cols-2 gap-2"><Detail label="School type" value={schoolTypeLabel(school.school_type)} icon={School} /><Detail label="Established" value={school.year_established ? String(school.year_established) : null} /></dl>
      </WorkspaceCard>

      <WorkspaceCard id="contact">
        <SectionTitle title="Contact information" description="These details help families contact your school directly." action={<EditDetails><form action={saveSchoolSection} className="space-y-3"><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="section" value="contact" /><Input label="Contact email" name="contactEmail" type="email" value={school.contact_email as string | null} /><Input label="Phone number" name="contactPhone" type="tel" value={school.contact_phone as string | null} /><Input label="Website" name="websiteUrl" type="url" value={school.website_url as string | null} placeholder="https://" /><Button size="sm">Save changes</Button></form></EditDetails>} />
        <dl className="mt-4 grid gap-2"><Detail label="Email" value={school.contact_email as string | null} icon={Mail} /><Detail label="Phone" value={school.contact_phone as string | null} icon={Phone} /><Detail label="Website" value={school.website_url as string | null} icon={Globe2} /></dl>
      </WorkspaceCard>

      <WorkspaceCard id="location">
        <SectionTitle title="Location" description="Your main campus location." action={<EditDetails><form action={saveSchoolSection} className="space-y-3"><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="section" value="location" />{data.mainBranch && <input type="hidden" name="branchId" value={data.mainBranch.id} />}<Input label="Country" name="country" value={data.mainBranch?.country || "Nigeria"} /><div className="grid gap-3 sm:grid-cols-2"><Input label="State" name="state" value={data.mainBranch?.state} /><Input label="City" name="city" value={data.mainBranch?.city} /><Input label="Area" name="area" value={data.mainBranch?.area} /><Input label="Street address" name="addressLine" value={data.mainBranch?.address_line} /></div><Button size="sm">Save location</Button></form></EditDetails>} />
        <p className="mt-4 text-sm font-bold text-[#0e2946]">{data.mainBranch?.address_line || "Street address not added yet"}</p><p className="mt-1 text-sm text-slate-500">{locationParts.join(", ") || "Add the town, area and state where families can find your school."}</p>
      </WorkspaceCard>

      <WorkspaceCard id="learning">
        <SectionTitle title="School levels & curriculum" description="Show which learners you teach and the curriculum you follow." action={<EditDetails><form action={saveLearningDetails} className="space-y-4"><input type="hidden" name="schoolId" value={schoolId} /><fieldset><legend className="text-xs font-extrabold text-slate-700">School levels</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{(allLevels ?? []).map((item) => <label key={item.code} className="flex min-h-10 items-center gap-2 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" name="levelCodes" value={item.code} defaultChecked={data.levels.some((selected) => selected.code === item.code)} className="size-4 accent-emerald-700" />{item.name}</label>)}</div></fieldset><fieldset><legend className="text-xs font-extrabold text-slate-700">Curriculum</legend><div className="mt-2 grid grid-cols-2 gap-2">{(allCurricula ?? []).map((item) => <label key={item.code} className="flex min-h-10 items-center gap-2 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" name="curriculumCodes" value={item.code} defaultChecked={data.curricula.some((selected) => selected.code === item.code)} className="size-4 accent-emerald-700" />{item.name}</label>)}</div></fieldset><Button size="sm">Save learning details</Button></form></EditDetails>} />
        <div className="mt-4"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Levels</p><div className="mt-2 flex flex-wrap gap-2">{data.levels.length ? data.levels.map((item) => <span key={item.code} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700">{item.name}</span>) : <span className="text-sm text-slate-400">Not added yet</span>}</div></div><div className="mt-4"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Curriculum</p><div className="mt-2 flex flex-wrap gap-2">{data.curricula.length ? data.curricula.map((item, index) => <span key={`${item.code}-${index}`} className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-900">{item.customName || item.name}</span>) : <span className="text-sm text-slate-400">Not added yet</span>}</div></div>
      </WorkspaceCard>

      <WorkspaceCard id="structure">
        <SectionTitle title="School structure" description="Let families know about your learning environment." action={<EditDetails><form action={saveSchoolSection} className="space-y-3"><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="section" value="structure" /><label className="block text-xs font-bold text-slate-700">Attendance<select name="structure" defaultValue={String(school.structure ?? "day")} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="day">Day school</option><option value="boarding">Boarding school</option><option value="day_and_boarding">Day and boarding</option></select></label><label className="block text-xs font-bold text-slate-700">Students<select name="gender" defaultValue={String(school.gender ?? "mixed")} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="mixed">Boys and girls</option><option value="boys">Boys</option><option value="girls">Girls</option></select></label><Button size="sm">Save structure</Button></form></EditDetails>} />
        <dl className="mt-4 grid grid-cols-2 gap-2"><Detail label="Attendance" value={schoolTypeLabel(school.structure)} icon={Building2} /><Detail label="Students" value={schoolTypeLabel(school.gender)} /></dl>
      </WorkspaceCard>

      <WorkspaceCard id="admissions">
        <SectionTitle title="Admission information" description="Share your current admissions status and what families should know." action={<Button asChild variant="outline" size="sm"><Link href="/school/admissions">Manage admissions <ArrowRight className="size-4" /></Link></Button>} />
        <div className="mt-4 flex flex-wrap items-center gap-3"><StatusPill value={String(school.admission_status)} /><span className="text-xs text-slate-500">{data.requirements.length} {data.requirements.length === 1 ? "requirement" : "requirements"} listed</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{String(school.admission_description ?? "") || "Admission information has not been added yet."}</p>
      </WorkspaceCard>

      <WorkspaceCard id="hours">
        <SectionTitle title="School hours" description="Help parents plan when to visit or contact your school." />
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">School hours are not collected yet. You can add them as part of a future profile update.</p>
      </WorkspaceCard>
    </div>
  </>;
}
