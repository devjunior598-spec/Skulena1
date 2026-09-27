import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Building2, CircleDollarSign, MapPin, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData, schoolCoverAndLogo, schoolTypeLabel } from "@/lib/schools/workspace";
import { formatNaira } from "@/data/schools";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "School profile preview" };

export default async function SchoolPreviewPage() {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <div className="rounded-2xl bg-white p-6"><h1 className="text-xl font-extrabold text-[#0e2946]">No school profile to preview</h1><p className="mt-2 text-sm text-slate-600">Start the school setup before previewing your profile.</p><Button asChild className="mt-4"><Link href="/for-schools/register">Start school setup</Link></Button></div>;
  const data = await getSchoolWorkspaceData(supabase, school.id);
  const { logo, cover } = schoolCoverAndLogo(data.media);
  const photos = data.media.filter((item) => item.url && item.media_type === "image" && item.category !== "School logo").slice(0, 4);
  const location = [data.mainBranch?.area, data.mainBranch?.city, data.mainBranch?.state].filter(Boolean).join(", ");
  const feeAmounts = data.fees.filter((item) => item.category === "tuition").map((item) => Number(item.amount)).filter(Number.isFinite);
  const lowestFee = feeAmounts.length ? Math.min(...feeAmounts) : null;
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-sky-800"><EyeIcon /></span><div><p className="text-sm font-extrabold text-sky-950">Private profile preview</p><p className="mt-1 text-xs leading-5 text-sky-900">Only your school team can see this preview. Draft information is not visible to the public.</p></div></div><div className="flex gap-2"><Button asChild variant="outline" size="sm"><Link href="/school/profile"><ArrowLeft className="size-4" />Back to profile</Link></Button>{school.status === "published" && <Button asChild size="sm"><Link href={`/school/${school.slug}`} target="_blank">View live profile <ArrowRight className="size-4" /></Link></Button>}</div></div>
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-48 bg-[linear-gradient(115deg,#dceee5,#e9f1f6_60%,#d8e6ef)] sm:h-64">{cover && <Image src={cover} alt={`${school.name} cover`} fill unoptimized className="object-cover" sizes="100vw" />}</div>
      <div className="px-4 pb-6 sm:px-7"><div className="flex flex-wrap items-end justify-between gap-4"><div className="-mt-10 flex min-w-0 items-end gap-3"><span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-emerald-50 text-emerald-800 shadow-sm sm:size-24">{logo ? <Image src={logo} alt={`${school.name} logo`} width={96} height={96} unoptimized className="size-full object-contain p-1" /> : <Building2 className="size-8" />}</span><div className="min-w-0 pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-extrabold tracking-tight text-[#0e2946] sm:text-3xl">{school.name}</h1><StatusPill value={school.status} /></div><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MapPin className="size-3.5" />{location || "School location not added"}</p></div></div></div>
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-7"><section><h2 className="text-lg font-extrabold text-[#0e2946]">About {school.name}</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{String(school.description ?? "") || "Add a description to introduce your school to families."}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600"><span className="inline-flex items-center gap-1.5"><Building2 className="size-4 text-emerald-700" />{schoolTypeLabel(school.school_type) || "School type not set"}</span><span className="inline-flex items-center gap-1.5"><Users className="size-4 text-emerald-700" />{schoolTypeLabel(school.structure) || "School structure not set"}</span>{Boolean(school.year_established) && <span>Established {String(school.year_established)}</span>}</div></section>
            <section className="border-t border-slate-100 pt-6"><h2 className="text-lg font-extrabold text-[#0e2946]">Learning at {school.name}</h2><div className="mt-3 flex flex-wrap gap-2">{data.levels.length ? data.levels.map((item) => <span key={item.code} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">{item.name}</span>) : <span className="text-sm text-slate-400">School levels not added yet</span>}</div><p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><BookOpen className="size-4 text-sky-700" />{data.curricula.map((item) => item.customName || item.name).join(" · ") || "Curriculum not added yet"}</p></section>
            <section className="border-t border-slate-100 pt-6"><h2 className="text-lg font-extrabold text-[#0e2946]">Facilities</h2><div className="mt-3 flex flex-wrap gap-2">{data.facilities.length ? data.facilities.map((item) => <span key={item.id} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">{item.custom_name || item.facility?.name || "Facility"}</span>) : <span className="text-sm text-slate-400">Facility information not added yet</span>}</div></section>
            <section className="border-t border-slate-100 pt-6"><h2 className="text-lg font-extrabold text-[#0e2946]">Photos & videos</h2>{photos.length ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{photos.map((item) => <div key={item.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><Image src={item.url!} alt={item.caption || `${item.category} at ${school.name}`} fill unoptimized className="object-cover" sizes="25vw" /></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Photos will appear here after they are approved.</p>}</section>
            <section className="border-t border-slate-100 pt-6"><h2 className="text-lg font-extrabold text-[#0e2946]">Admissions</h2><p className="mt-3 text-sm leading-6 text-slate-600">{String(school.admission_description ?? "") || "Admission information has not been added yet."}</p><div className="mt-3 flex flex-wrap gap-2">{data.requirements.map((item) => <span key={item.id} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{item.requirement}</span>)}</div></section>
          </div>
          <aside className="space-y-3"><div className="rounded-2xl border border-slate-200 p-4"><p className="flex items-center gap-2 text-xs font-bold text-slate-500"><CircleDollarSign className="size-4 text-emerald-700" />Fees</p><p className="mt-2 text-2xl font-extrabold text-[#0e2946]">{lowestFee === null ? "Not provided" : `From ${formatNaira(lowestFee)}`}</p><p className="mt-1 text-xs text-slate-500">Final fees depend on level and term.</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm font-extrabold text-[#0e2946]"><ShieldCheck className="size-4 text-emerald-700" />School information</p><p className="mt-2 text-xs leading-5 text-slate-600">A trust indicator appears only after Skulena verifies the relevant information.</p>{data.verification.some((item) => item.status === "verified") && <p className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800"><BadgeCheck className="size-4" />Verified information</p>}</div></aside>
        </div>
      </div>
    </article>
    {data.error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">Some information could not be loaded for this preview.</p>}
  </>;
}

function EyeIcon() { return <BadgeCheck className="size-4" aria-hidden="true" />; }
