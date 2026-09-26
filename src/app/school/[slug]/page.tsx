import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, BookOpen, Bus, Check, ChevronRight, Computer, Library, MapPin, Microscope, School, ShieldCheck, Stethoscope, Trees } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { VerificationBadge } from "@/components/schools/verification-badge";
import { ProfileGallery } from "@/components/schools/profile-gallery";
import { SaveButton, ShareButton } from "@/components/schools/school-actions";
import { formatNaira } from "@/data/schools";
import { getPublicSchoolBySlug } from "@/lib/schools/public-schools";
import { getSchoolProfile } from "@/data/profile";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const school = await getPublicSchoolBySlug((await params).slug);
  if (!school) return {};
  return { title: school.name, description: school.description };
}

const facilityIcons = { "Science Laboratory": Microscope, "ICT Laboratory": Computer, Library, Sports: School, Playground: Trees, Transportation: Bus, "Sick Bay": Stethoscope, Boarding: BedDouble, Security: ShieldCheck };
const profileSections = [{ name: "Overview", id: "overview" }, { name: "Facilities", id: "facilities" }, { name: "Fees", id: "fees" }, { name: "Admissions", id: "admissions" }, { name: "Photos & videos", id: "photos" }, { name: "Reviews", id: "reviews" }];

export default async function SchoolProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const school = await getPublicSchoolBySlug(slug);
  if (!school) notFound();
  const profile = getSchoolProfile(school);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main-content" className="pb-16">
        <div className="mx-auto max-w-7xl px-5 pb-4 pt-5 sm:px-8 lg:px-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm font-semibold text-slate-500">
            <Link href="/schools" className="flex items-center gap-1 hover:text-emerald-700"><ArrowLeft className="size-3.5" /> Schools</Link><ChevronRight className="size-3" /><span aria-current="page" className="text-slate-800">{school.shortName}</span>
          </nav>
        </div>

        <section aria-label="School photo gallery" className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><ProfileGallery media={profile.media} variant="hero" /></section>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 border-b border-slate-200 py-8 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification</span><VerificationBadge level={school.verification} /></div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0"><h1 className="text-balance text-3xl font-extrabold tracking-[-0.045em] text-[#0e2946] sm:text-4xl">{school.name}</h1><p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-slate-500"><MapPin className="size-4 shrink-0 text-emerald-600" /><span>{school.location}</span></p></div>
                <div className="hidden shrink-0 gap-2 sm:flex"><SaveButton slug={slug} name={school.name} /><ShareButton name={school.name} /></div>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                {school.curriculum.length > 0 && <p className="flex items-center gap-2"><BookOpen className="size-4 text-sky-600" /><span className="font-semibold text-slate-700">{school.curriculum.join(" + ")}</span></p>}
                <p className="flex items-center gap-2"><School className="size-4 text-emerald-600" /><span className="font-semibold text-slate-700">{school.type}</span></p>
              </div>
              {school.levels.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{school.levels.map((level) => <span key={level} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">{level}</span>)}</div>}
              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">School profiles are created by school representatives. Verification applies only to the records identified as checked.</p>
              <div className="mt-5 flex gap-2 sm:hidden"><SaveButton slug={slug} name={school.name} /><ShareButton name={school.name} /></div>
            </div>
            <aside className="rounded-2xl border border-slate-200 p-5 shadow-[0_16px_40px_-28px_rgba(15,41,70,.45)]">
              <p className="text-sm font-bold text-slate-500">Tuition per term</p><p className="mt-1 text-3xl font-extrabold text-[#0e2946]">{school.feeFrom > 0 ? <>{formatNaira(school.feeFrom)}{school.feeTo > school.feeFrom && <> – {formatNaira(school.feeTo)}</>}</> : "Not provided"}</p>
              <a href="#fees" className="mt-2 inline-block text-sm font-bold text-emerald-700 underline-offset-4 hover:underline">Fee information</a>
              <div className="mt-5 rounded-xl bg-slate-50 p-4"><h2 className="font-extrabold text-[#0e2946]">Admissions and visits</h2><p className="mt-2 text-sm leading-6 text-slate-600">Contact the school directly to confirm current availability, requirements and visit arrangements.</p></div>
            </aside>
          </div>
        </section>

        <div className="sticky top-18 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><nav className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-5 sm:px-8 lg:px-10" aria-label="School profile sections">{profileSections.map((item) => <a key={item.id} href={`#${item.id}`} className="shrink-0 border-b-2 border-transparent py-4 text-sm font-bold text-slate-600 hover:border-emerald-600 hover:text-emerald-700 focus-visible:border-emerald-600 focus-visible:text-emerald-700">{item.name}</a>)}</nav></div>

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-10">
          <div className="min-w-0 space-y-12">
            <section id="overview" className="scroll-mt-36"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">About {school.shortName}</h2><p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{school.description}</p><dl className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-200 py-5"><div><dt className="flex items-center gap-2 text-sm text-slate-500"><School className="size-4" /> School type</dt><dd className="mt-2 font-extrabold text-[#0e2946]">{school.type}</dd></div>{school.levels.length > 0 && <div><dt className="flex items-center gap-2 text-sm text-slate-500"><BookOpen className="size-4" /> Levels</dt><dd className="mt-2 font-extrabold text-[#0e2946]">{school.levels.join(", ")}</dd></div>}</dl></section>

            <section id="facilities" className="scroll-mt-36 border-t border-slate-200 pt-10"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Facilities</h2><p className="mt-2 text-sm leading-6 text-slate-500">Information provided by the school. Verification is shown only where a current record is available.</p>{school.facilities.length > 0 ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{school.facilities.map((facility) => { const Icon = facilityIcons[facility as keyof typeof facilityIcons] ?? Check; return <div key={facility} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"><span className="rounded-xl bg-emerald-50 p-2.5"><Icon className="size-5 text-emerald-600" /></span><h3 className="text-sm font-extrabold text-[#0e2946]">{facility}</h3></div>; })}</div> : <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">Facility information has not been added yet.</p>}</section>

            <section id="fees" className="scroll-mt-36 border-t border-slate-200 pt-10"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Fees</h2>{school.feeFrom > 0 ? <div className="mt-5 rounded-2xl bg-slate-50 p-5"><p className="text-xl font-extrabold text-[#0e2946]">{formatNaira(school.feeFrom)}{school.feeTo > school.feeFrom && <> – {formatNaira(school.feeTo)}</>} <span className="text-sm font-semibold text-slate-500">/ term</span></p><p className="mt-2 text-sm leading-6 text-slate-600">Contact the school for a complete fee breakdown and current charges.</p></div> : <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">Fee information has not been added yet.</p>}</section>

            <section id="admissions" className="scroll-mt-36 border-t border-slate-200 pt-10"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Admissions</h2><p className="mt-4 text-sm leading-7 text-slate-600">{profile.admissions.status}</p></section>

            <section id="photos" className="scroll-mt-36 border-t border-slate-200 pt-10"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Photos & videos</h2><p className="mb-6 mt-2 text-sm leading-6 text-slate-500">School media shared for this profile. Videos are available after approval.</p><ProfileGallery media={profile.media} /></section>

            <section id="reviews" className="scroll-mt-36 border-t border-slate-200 pt-10"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Parent reviews</h2><p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">No parent reviews are currently available for this school.</p></section>
          </div>

          <aside className="min-w-0"><div className="space-y-5 lg:sticky lg:top-40"><section id="location" className="scroll-mt-36 overflow-hidden rounded-2xl border border-slate-200"><div className="flex items-center gap-4 bg-[#eaf3ee] p-6"><span className="rounded-2xl bg-white p-3"><MapPin className="size-7 text-emerald-700" /></span><div><h2 className="text-xl font-extrabold text-[#0e2946]">{school.city || school.location}</h2><p className="mt-1 text-sm text-slate-600">School location</p></div></div><div className="p-5"><p className="text-sm font-extrabold text-[#0e2946]">{school.location}</p><p className="mt-3 text-sm leading-6 text-slate-500">Confirm the campus address with the school before visiting.</p></div></section><div className="rounded-2xl bg-[#f8fafb] p-5"><h2 className="font-extrabold text-[#0e2946]">Make a confident choice</h2><p className="mt-2 text-sm leading-6 text-slate-500">Compare published information and confirm current details directly with the school.</p><Link href="/schools" className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-emerald-700">Explore more schools <ChevronRight className="size-4" /></Link></div></div></aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
