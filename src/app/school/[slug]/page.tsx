import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, BookOpen, Bus, Check, ChevronRight, Clock3, Computer, Info, Library, MapPin, MessageCircle, Microscope, School, ShieldCheck, Star, Stethoscope, Trees, Users } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MobileNav } from "@/components/site/mobile-nav";
import { VerificationBadge } from "@/components/schools/verification-badge";
import { ProfileGallery } from "@/components/schools/profile-gallery";
import { DemoAction, SaveButton, ShareButton } from "@/components/schools/school-actions";
import { schools, formatNaira } from "@/data/schools";
import { getPublicSchoolBySlug } from "@/lib/schools/public-schools";
import { getSchoolProfile } from "@/data/profile";
import { formatVerificationDate, getVerificationRecord } from "@/data/verification";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return schools.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const school = await getPublicSchoolBySlug(slug);
  if (!school) return {};
  return { title: `${school.name}${school.isDemo ? " — Demo profile" : ""}`, description: school.isDemo ? `Explore the fictional ${school.name} profile in Skulena's school discovery demo.` : school.description };
}

const facilityIcons = { "Science Laboratory": Microscope, "ICT Laboratory": Computer, Library, Sports: School, Playground: Trees, Transportation: Bus, "Sick Bay": Stethoscope, Boarding: BedDouble, Security: ShieldCheck };
const profileSections = [{ name: "Overview", id: "overview" }, { name: "Facilities", id: "facilities" }, { name: "Fees", id: "fees" }, { name: "Admissions", id: "admissions" }, { name: "Photos & Videos", id: "photos-and-videos" }, { name: "Reviews", id: "reviews" }];
const demoApplicationDisclosure = "This is a fictional school profile. Admission applications are not open in this demo, and nothing will be sent to a school. Please do not share child information or documents here.";
const demoVisitDisclosure = "Visit booking is a preview feature. No visit will be scheduled or request sent from this demo. Contact a real school directly to confirm its location and arrange a visit.";
const demoContactDisclosure = "This fictional listing has no live contact details. No message will be sent. School enquiries will become available when real schools and secure messaging are connected.";

export default async function SchoolProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const school = await getPublicSchoolBySlug(slug);
  if (!school) notFound();
  const profile = getSchoolProfile(school);
  const profileRecord = getVerificationRecord(slug, "profile", "campus");
  const feeRecord = getVerificationRecord(slug, "fees", profile.fees.verificationKey);
  const applicationDisclosure = school.isDemo ? demoApplicationDisclosure : "Online applications are not available yet. Contact the school directly to ask about its published admissions information. Do not share child information or documents through this page.";
  const visitDisclosure = school.isDemo ? demoVisitDisclosure : "School visit booking is not available in this phase. Contact the school directly to arrange a visit.";
  const contactDisclosure = school.isDemo ? demoContactDisclosure : "Direct messages are not available in this phase. Use the school’s published contact details where available.";
  // Demo records have no public review or rating structured data. Production
  // school and review schema must come from real, publishable records.

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main-content" className="pb-40 lg:pb-0">
        <div className="mx-auto max-w-7xl px-5 pb-4 pt-5 sm:px-8 lg:px-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm font-semibold text-slate-500">
            <Link href="/schools" className="flex items-center gap-1 hover:text-emerald-700"><ArrowLeft className="size-3.5" /> Schools</Link><ChevronRight className="size-3" /><span>Oyo</span><ChevronRight className="size-3" /><span>{school.city}</span><ChevronRight className="size-3" /><span aria-current="page" className="text-slate-800">{school.shortName}</span>
          </nav>
        </div>

        <section aria-label="School photo gallery" className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><ProfileGallery media={profile.media} variant="hero" /></section>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {school.isDemo && <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950"><Info className="mt-1 size-4 shrink-0" /><p><strong>Demo school profile.</strong> School details, fees, reviews and verification records are fictional examples. Photos are illustrative stock images.</p></div>}
          <div className="grid gap-8 border-b border-slate-200 py-8 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification</span><VerificationBadge level={school.verification} /></div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0"><h1 className="text-balance text-3xl font-extrabold tracking-[-0.045em] text-[#0e2946] sm:text-4xl">{school.name}</h1><p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-slate-500"><MapPin className="size-4 shrink-0 text-emerald-600" /><span>{school.location} <a href="#location" className="ml-1 inline-block font-bold text-emerald-700 underline-offset-4 hover:underline">Location details</a></span></p></div>
                <div className="hidden shrink-0 gap-2 sm:flex"><SaveButton slug={slug} /><ShareButton name={school.name} /></div>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <p className="flex items-center gap-2"><BookOpen className="size-4 text-sky-600" /><span className="font-semibold text-slate-700">{school.curriculum.join(" + ")}</span></p>
                <p className="flex items-center gap-2"><School className="size-4 text-emerald-600" /><span className="font-semibold text-slate-700">{school.type}</span></p>
                <a href="#reviews" className="flex items-center gap-2 font-semibold text-slate-600 hover:text-emerald-700"><MessageCircle className="size-4" />{profile.reviews.length ? `${profile.reviews.length} ${school.isDemo ? "sample " : ""}review${profile.reviews.length === 1 ? "" : "s"}` : "No reviews added"}</a>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">{school.levels.map((level) => <span key={level} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">{level}</span>)}</div>
              <details className="mt-5 rounded-xl border border-slate-200 px-4 py-3 text-sm"><summary className="cursor-pointer font-bold text-slate-700">{school.isDemo ? "What this demo verification covers" : "About verification"}</summary><p className="mt-3 leading-6 text-slate-600">{school.isDemo ? (profileRecord ? `${profileRecord.evidence} Sample record dated ${formatVerificationDate(profileRecord.checkedAt)}. Reference: ${profileRecord.id}.` : "This is a school-provided example. No document review or campus inspection record is attached to this profile.") : "A verification badge comes only from an authorized, current verification record. Creating or publishing a school profile does not award one."}</p><p className="mt-2 leading-6 text-slate-600">A profile badge does not verify every claim. Check the status and evidence for each facility and the fee schedule below.</p></details>
              <div className="mt-5 flex gap-2 sm:hidden"><SaveButton slug={slug} /><ShareButton name={school.name} /></div>
            </div>
            <aside className="rounded-2xl border border-slate-200 p-5 shadow-[0_16px_40px_-28px_rgba(15,41,70,.45)]">
              <p className="text-sm font-bold text-slate-500">{school.isDemo ? "Sample tuition from" : "Tuition from"}</p><p className="mt-1 text-3xl font-extrabold text-[#0e2946]">{school.feeFrom > 0 ? formatNaira(school.feeFrom) : "Ask school"}{school.feeFrom > 0 && <span className="text-sm font-semibold text-slate-500"> / term</span>}</p><a href="#fees" className="mt-2 inline-block text-sm font-bold text-emerald-700 underline-offset-4 hover:underline">See fees and what is included</a>
              <div className="mt-5 grid gap-2"><DemoAction size="lg" title={school.isDemo ? "Admissions preview" : "Admissions coming soon"} description={applicationDisclosure}>Apply for admission</DemoAction><DemoAction variant="outline" size="lg" title={school.isDemo ? "School visits preview" : "Visit booking coming soon"} description={visitDisclosure}>Book a school visit</DemoAction><DemoAction variant="ghost" title={school.isDemo ? "Contact school preview" : "Messages coming soon"} description={contactDisclosure}><MessageCircle className="size-4" /> Contact school</DemoAction></div><p className="mt-3 text-center text-xs leading-5 text-slate-500">{school.isDemo ? "Demo actions only. No requests are sent." : "Online requests are not available yet."}</p>
            </aside>
          </div>
        </section>

        <div className="sticky top-18 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><nav className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-5 sm:px-8 lg:px-10" aria-label="School profile sections">{profileSections.map((item) => <a key={item.id} href={`#${item.id}`} className="shrink-0 border-b-2 border-transparent py-4 text-sm font-bold text-slate-600 hover:border-emerald-600 hover:text-emerald-700 focus-visible:border-emerald-600 focus-visible:text-emerald-700">{item.name}</a>)}</nav></div>

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-10">
          <div className="min-w-0 space-y-12">
            <section id="overview" className="scroll-mt-36"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">About {school.shortName}</h2><p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{school.description}</p>{school.isDemo && <details className="mt-4 text-sm"><summary className="w-fit cursor-pointer font-extrabold text-emerald-700">Read the sample school story</summary><p className="mt-3 text-base leading-7 text-slate-600">{profile.story}</p></details>}<dl className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-200 py-5">{school.classSize > 0 && <div><dt className="flex items-center gap-2 text-sm text-slate-500"><Users className="size-4" /> {school.isDemo ? "Sample class size" : "Class size"}</dt><dd className="mt-2 font-extrabold text-[#0e2946]">{school.classSize} students</dd></div>}<div><dt className="flex items-center gap-2 text-sm text-slate-500"><School className="size-4" /> School type</dt><dd className="mt-2 font-extrabold text-[#0e2946]">{school.type}</dd></div></dl></section>

            <section id="facilities" className="scroll-mt-36 border-t border-slate-200 pt-10">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Facilities</h2><p className="mt-2 text-sm leading-6 text-slate-500">{school.isDemo ? "Sample facilities and their individual evidence status. Open a record to see its scope." : "Facilities provided by the school. Verification is shown only where an authorized record exists."}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">{school.facilities.map((facility) => {
                const Icon = facilityIcons[facility as keyof typeof facilityIcons] ?? Check;
                const record = getVerificationRecord(slug, "facility", facility);
                return <div key={facility} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2.5"><Icon className="size-5 text-emerald-600" /></span><h3 className="text-sm font-extrabold text-[#0e2946]">{facility}</h3></div><div className="mt-4"><VerificationBadge level={record?.level ?? "school-provided"} /></div>{school.isDemo ? (record ? <details className="mt-3 text-xs leading-5 text-slate-600"><summary className="cursor-pointer font-bold text-emerald-700">View demo evidence</summary><p className="mt-2">{record.evidence}</p><p className="mt-1">Sample date: {formatVerificationDate(record.checkedAt)}</p><p className="mt-1 break-words">Record: {record.id}</p></details> : <p className="mt-3 text-xs leading-5 text-slate-500">Sample school-provided entry. No matching verification record.</p>) : <p className="mt-3 text-xs leading-5 text-slate-500">School-provided facility information.</p>}</div>;
              })}</div>
              <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"><strong>Understanding the badges:</strong> School Provided means no independent check. Document Verified covers the named document. Physically Verified covers the named inspection.{school.isDemo ? " All records on this page are demo examples." : ""}</p>
            </section>

            <section id="fees" className="scroll-mt-36 border-t border-slate-200 pt-10">
              <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Fees</h2><p className="mt-2 text-sm text-slate-500">{profile.fees.rows.length ? `${profile.fees.session}${school.isDemo ? " sample" : ""} tuition · per term` : school.isDemo ? "Sample fee estimate · session not specified" : "Fee information provided by the school"}</p></div><VerificationBadge level={feeRecord?.level ?? "school-provided"} /></div>
              {profile.fees.rows.length ? <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><caption className="sr-only">{school.isDemo ? "Sample " : ""}tuition fees by school level, in Nigerian naira per term</caption><thead className="bg-slate-50 text-slate-500"><tr><th scope="col" className="px-4 py-3 font-bold">School level</th><th scope="col" className="px-4 py-3 text-right font-bold">Tuition range</th></tr></thead><tbody>{profile.fees.rows.map((fee) => <tr key={fee.level} className="border-t border-slate-200"><th scope="row" className="px-4 py-4 font-bold text-[#0e2946]">{fee.level}</th><td className="px-4 py-4 text-right font-bold text-[#0e2946]">{formatNaira(fee.from)} – {formatNaira(fee.to)}</td></tr>)}</tbody></table></div> : <div className="mt-5 rounded-2xl bg-slate-50 p-5"><p className="text-xl font-extrabold text-[#0e2946]">{school.feeFrom > 0 ? <>{formatNaira(school.feeFrom)} – {formatNaira(school.feeTo)} <span className="text-sm font-semibold text-slate-500">/ term</span></> : "Fee details not added"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{school.isDemo ? "This is an overall demo estimate. A breakdown by school level and a supporting fee document have not been provided." : "Confirm a complete fee breakdown with the school before applying."}</p></div>}
              {profile.fees.excludes.length > 0 && <p className="mt-4 text-sm leading-6 text-slate-600"><strong>Not included:</strong> {profile.fees.excludes.join(", ").toLowerCase()}. A complete fee schedule should be confirmed before applying.</p>}
              {feeRecord && <details className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950"><summary className="cursor-pointer font-bold">View sample fee evidence</summary><p className="mt-2">{feeRecord.evidence}</p><p className="mt-2">Sample date: {formatVerificationDate(feeRecord.checkedAt)}. Record: {feeRecord.id}.</p></details>}
            </section>

            <section id="admissions" className="scroll-mt-36 border-t border-slate-200 pt-10"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Admissions</h2>{profile.admissions.steps.length > 0 && <ol className="mt-5 grid gap-3 sm:grid-cols-3">{profile.admissions.steps.map((step, index) => <li key={step} className="rounded-2xl bg-slate-50 p-4"><span className="grid size-7 place-items-center rounded-full bg-[#0e2946] text-xs font-extrabold text-white">{index + 1}</span><p className="mt-3 text-sm font-extrabold text-[#0e2946]">{step}</p></li>)}</ol>}<div className="mt-5 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4"><Clock3 className="mt-0.5 size-5 shrink-0 text-sky-700" /><p className="text-sm leading-6 text-sky-950">{profile.admissions.status}</p></div>{profile.admissions.requirements.length > 0 && <ul className="mt-5 space-y-3">{profile.admissions.requirements.map((requirement) => <li key={requirement} className="flex gap-2 text-sm leading-6 text-slate-600"><Check className="mt-1 size-4 shrink-0 text-emerald-600" />{requirement}</li>)}</ul>}</section>

            <section id="photos-and-videos" className="scroll-mt-36 border-t border-slate-200 pt-10"><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Photos & videos</h2><p className="mb-6 mt-2 text-sm leading-6 text-slate-500">{school.isDemo ? "Explore media by facility. These stock photos illustrate the layout and do not show or verify this school." : "Approved school media, grouped by facility where available."}</p><ProfileGallery media={profile.media} /></section>

            <section id="reviews" className="scroll-mt-36 border-t border-slate-200 pt-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold tracking-tight text-[#0e2946]">Parent reviews</h2><p className="mt-2 text-sm leading-6 text-slate-500">{school.isDemo ? "Example review content, not a live school rating." : "Moderated parent reviews will appear here."}</p></div><DemoAction variant="outline" size="sm" title={school.isDemo ? "Reviews preview" : "Reviews coming soon"} description={school.isDemo ? "Review submission is not available in this demo. The example below is fictional; no parent identity has been verified and no review will be published." : "Review submission is not available in this phase yet."}>Write a review</DemoAction></div>{profile.reviews.length ? profile.reviews.map((review) => <article key={review.id} className="mt-6 rounded-2xl border border-slate-200 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold text-[#0e2946]">{review.author}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{review.context}</p></div><div className="flex" aria-label={`${school.isDemo ? "Example " : ""}rating: ${review.rating} out of 5`}>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />)}</div></div><p className="mt-4 text-sm leading-6 text-slate-600">{review.text}</p></article>) : <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">{school.isDemo ? "No sample reviews have been added for this school." : "No moderated reviews have been published for this school."}</p>}</section>
          </div>

          <aside className="min-w-0"><div className="space-y-5 lg:sticky lg:top-40"><section id="location" className="scroll-mt-36 overflow-hidden rounded-2xl border border-slate-200"><div className="flex items-center gap-4 bg-[#eaf3ee] p-6"><span className="rounded-2xl bg-white p-3"><MapPin className="size-7 text-emerald-700" /></span><div><h2 className="text-xl font-extrabold text-[#0e2946]">{school.city || school.location}</h2><p className="mt-1 text-sm text-slate-600">{school.isDemo ? "Sample location" : "School location"}</p></div></div><div className="p-5"><p className="text-sm font-extrabold text-[#0e2946]">{school.location}</p><p className="mt-3 text-sm leading-6 text-slate-500">{school.isDemo ? "No real campus address or map coordinates are available for this fictional listing." : "Map directions are not connected yet. Confirm the campus location with the school before visiting."}</p>{school.isDemo && <DemoAction variant="outline" className="mt-4 w-full" title="Location preview" description="This demo has no verified campus coordinates. Live maps and directions will be available for published school locations.">View location information</DemoAction>}</div></section><div className="rounded-2xl bg-[#f8fafb] p-5"><h2 className="font-extrabold text-[#0e2946]">Make a confident choice</h2><p className="mt-2 text-sm leading-6 text-slate-500">Compare tuition, ask about support for your child and visit the facilities before choosing a school.</p><Link href="/schools" className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-emerald-700">Explore more schools <ChevronRight className="size-4" /></Link></div></div></aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-[var(--mobile-nav-height)] z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-10px_30px_-20px_rgba(15,41,70,.4)] lg:hidden"><div className="mx-auto flex max-w-xl gap-2"><DemoAction variant="outline" className="flex-1" title={school.isDemo ? "School visits preview" : "Visit booking coming soon"} description={visitDisclosure}>Book visit</DemoAction><DemoAction className="flex-1" title={school.isDemo ? "Admissions preview" : "Admissions coming soon"} description={applicationDisclosure}>Apply now</DemoAction></div></div>
      <Footer />
      <MobileNav />
    </div>
  );
}
