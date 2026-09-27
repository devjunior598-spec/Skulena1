import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Bus,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Globe2,
  Library,
  Mail,
  MessageCircle,
  Microscope,
  Phone,
  School,
  ShieldCheck,
  Star,
  Stethoscope,
  Trees,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { School as SchoolRecord, PublicVerificationRecord, SchoolFacilityDetail } from "@/data/schools";
import type { SchoolProfileDetails } from "@/data/profile";
import { formatNaira } from "@/data/schools";
import { ProfileGallery } from "@/components/schools/profile-gallery";
import { getPublicEmail, getPublicPhone, getPublicWebsiteUrl } from "@/components/schools/school-profile-shell";
import type { SchoolProfileSection } from "@/components/schools/school-profile-shell";

function FacilityIcon({ name, className }: { name: string; className?: string }) {
  if (/classroom|learning/i.test(name)) return <School className={className} aria-hidden="true" />;
  if (/science|laboratory|lab/i.test(name)) return <Microscope className={className} aria-hidden="true" />;
  if (/library|book/i.test(name)) return <Library className={className} aria-hidden="true" />;
  if (/playground|sport|basketball|field/i.test(name)) return <Trees className={className} aria-hidden="true" />;
  if (/bus|transport/i.test(name)) return <Bus className={className} aria-hidden="true" />;
  if (/dining|kitchen|meal/i.test(name)) return <Utensils className={className} aria-hidden="true" />;
  if (/sick|health|clinic/i.test(name)) return <Stethoscope className={className} aria-hidden="true" />;
  if (/security/i.test(name)) return <ShieldCheck className={className} aria-hidden="true" />;
  if (/admission|requirement|document/i.test(name)) return <FileText className={className} aria-hidden="true" />;
  return <CheckCircle2 className={className} aria-hidden="true" />;
}

function SectionHeading({ eyebrow, title, description, id }: { eyebrow: string; title: string; description?: string; id?: string }) {
  return <header className="mb-4">
    <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-emerald-800">{eyebrow}</p>
    <h2 id={id} className="mt-1 text-xl font-extrabold tracking-[-.035em] text-[#102d47] sm:text-2xl">{title}</h2>
    {description && <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
  </header>;
}

function ContentCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_-28px_rgba(14,41,70,.38)] sm:p-5 ${className}`}>{children}</div>;
}

function EmptyState({ icon: Icon, title, description, compact = false }: { icon: LucideIcon; title: string; description?: string; compact?: boolean }) {
  return <div role="status" className={`flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white ${compact ? "p-4" : "p-5"}`}>
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf4ef] text-emerald-800"><Icon className="size-4" aria-hidden="true" /></span>
    <span className="min-w-0"><strong className="block text-sm text-[#18344d]">{title}</strong>{description && <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>}</span>
  </div>;
}

function KeyInformation({ school }: { school: SchoolRecord }) {
  type InformationItem = { label: string; value: string; icon: LucideIcon };
  const items = [
    school.schoolType ? { label: "School type", value: school.schoolType, icon: School } : null,
    school.type ? { label: "School structure", value: school.type, icon: School } : null,
    school.gender ? { label: "Gender", value: school.gender, icon: ShieldCheck } : null,
    school.yearEstablished ? { label: "Year established", value: String(school.yearEstablished), icon: CalendarDays } : null,
    school.levels.length > 0 ? { label: "Learning stages", value: school.levels.join(", "), icon: BookOpen } : null,
    school.curriculum.length > 0 ? { label: "Curriculum", value: school.curriculum.join(", "), icon: BookOpen } : null,
  ].filter((item): item is InformationItem => item !== null);

  if (!items.length) return <EmptyState icon={FileText} title="Key information has not been added yet" compact />;
  return <ContentCard>
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map(({ label, value, icon: Icon }) => <div key={label} className="flex min-w-0 gap-2.5 rounded-xl bg-[#f7f9f7] p-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-emerald-800" aria-hidden="true" />
        <div className="min-w-0"><dt className="text-[11px] font-semibold text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-sm font-bold text-slate-800">{value}</dd></div>
      </div>)}
    </dl>
  </ContentCard>;
}

function Programs({ school }: { school: SchoolRecord }) {
  const classes = school.classes ?? [];
  const grouped = new Map<string, typeof classes>();
  for (const item of classes) {
    const key = item.level || "Classes at this school";
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return <div className="space-y-3">
    {school.curriculum.length > 0 && <ContentCard>
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">Curriculum listed by the school</p>
      <div className="mt-2 flex flex-wrap gap-2">{school.curriculum.map((item) => <span key={item} className="rounded-full bg-[#edf4f8] px-3 py-1.5 text-xs font-bold text-[#294761]">{item}</span>)}</div>
    </ContentCard>}
    {classes.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">
      {Array.from(grouped.entries()).map(([level, levelClasses]) => <ContentCard key={level}>
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#18344d]"><BookOpen className="size-4 text-emerald-800" aria-hidden="true" />{level}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">{levelClasses.map((item) => <li key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{item.name}</li>)}</ul>
      </ContentCard>)}
    </div> : school.levels.length > 0 ? <ContentCard>
      <p className="text-xs leading-5 text-slate-600">These are the learning stages the school has listed. Class-by-class availability has not been provided.</p>
      <ul className="mt-3 flex flex-wrap gap-2">{school.levels.map((level) => <li key={level} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">{level}</li>)}</ul>
    </ContentCard> : <EmptyState icon={BookOpen} title="Programmes and class details have not been provided" compact />}
  </div>;
}

function OverviewPage({ school, profile }: { school: SchoolRecord; profile: SchoolProfileDetails }) {
  const description = profile.story.trim();
  const cutoff = 720;
  const shouldCollapse = description.length > cutoff;
  const splitAt = shouldCollapse ? Math.max(description.lastIndexOf(" ", cutoff), cutoff - 1) : description.length;
  const preview = description.slice(0, splitAt);
  const remaining = description.slice(splitAt).trim();
  return <>
    <section id="overview" className="scroll-mt-32 space-y-4" aria-labelledby="about-school-heading">
      <SectionHeading eyebrow="About the school" title={`About ${school.shortName}`} id="about-school-heading" />
      {description ? <ContentCard>
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{shouldCollapse ? `${preview}…` : description}</p>
        {shouldCollapse && <details className="mt-3"><summary className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4">Read more</summary><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">{remaining}</p></details>}
        <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-800" aria-hidden="true" />School descriptions are supplied by school representatives. Confirm current details directly.</p>
      </ContentCard> : <EmptyState icon={School} title="The school has not added an about description yet" compact />}
      <div>
        <h3 className="mb-2 text-sm font-extrabold text-[#18344d]">Key information</h3>
        <KeyInformation school={school} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-extrabold text-[#18344d]">Programmes & curriculum</h3>
        <Programs school={school} />
      </div>
    </section>
    <section id="facilities" className="scroll-mt-32" aria-labelledby="facilities-heading">
      <SectionHeading eyebrow="Spaces & support" title="Facilities" id="facilities-heading" description="Facilities listed by the school, with evidence shown only when it applies to that specific facility." />
      <FacilitiesPage school={school} />
    </section>
    <section id="fees" className="scroll-mt-32" aria-labelledby="fees-heading">
      <SectionHeading eyebrow="Plan your budget" title="Fees & costs" id="fees-heading" description="Review the published charges, then confirm the complete current schedule with the school before paying." />
      <FeesPage school={school} />
    </section>
    <section id="admissions" className="scroll-mt-32" aria-labelledby="admissions-heading">
      <SectionHeading eyebrow="Your next step" title="Admissions & contact" id="admissions-heading" description="Review intake information, apply through Skulena when available, or contact the school directly." />
      <AdmissionsPage school={school} />
    </section>
    <section id="photos" className="scroll-mt-32" aria-labelledby="photos-heading">
      <SectionHeading eyebrow="Take a closer look" title="Photos & videos" id="photos-heading" description="School-submitted media approved for public display." />
      <PhotosPage profile={profile} />
    </section>
    <section id="reviews" className="scroll-mt-32" aria-labelledby="reviews-heading">
      <SectionHeading eyebrow="Family experiences" title="Parent reviews" id="reviews-heading" description="Reviews published for this school. Reviewer identity is not displayed unless the public record supports it." />
      <ReviewsPage school={school} />
    </section>
  </>;
}

function FacilityVerification({ record }: { record: PublicVerificationRecord | null }) {
  const label = record?.method === "physically_verified" ? "Physically checked" : record?.method === "document_verified" ? "Documents reviewed" : "School-provided";
  const color = record?.method === "physically_verified" || record?.method === "document_verified" ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-600";
  return <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${color}`}><ShieldCheck className="size-3" aria-hidden="true" />{label}</span>;
}

function FacilitiesPage({ school }: { school: SchoolRecord }) {
  const facilities = school.facilityDetails ?? [];
  if (!facilities.length) return <EmptyState icon={School} title="This school hasn’t added facility information yet" compact />;
  return <div className="grid gap-3 sm:grid-cols-2">
    {facilities.map((facility) => <FacilityCard key={facility.id} facility={facility} media={school.media ?? []} />)}
  </div>;
}

function FacilityCard({ facility, media }: { facility: SchoolFacilityDetail; media: SchoolRecord["media"] }) {
  const facilityName = facility.name.toLocaleLowerCase("en-NG").replace(/s\b/, "");
  const facilityPhotos = (media ?? []).filter((item) => item.mediaType === "image" && (item.category.toLocaleLowerCase("en-NG").includes(facilityName) || facilityName.includes(item.category.toLocaleLowerCase("en-NG")))).slice(0, 2);
  return <article className="flex min-w-0 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_-24px_rgba(14,41,70,.5)]">
    <div className="min-w-0 flex-1"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf4ef] text-emerald-900"><FacilityIcon name={facility.name} className="size-4.5" /></span><div className="min-w-0"><h3 className="break-words text-sm font-extrabold text-[#18344d]">{facility.name}</h3>{facility.description && <p className="mt-1.5 text-xs leading-5 text-slate-600">{facility.description}</p>}<FacilityVerification record={facility.verification} /></div></div>
      {facilityPhotos.length > 0 && <Link href="#photos" aria-label={`View ${facility.name} photos`} className="mt-3 grid grid-cols-2 gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-emerald-700">{facilityPhotos.map((photo) => <span key={photo.id} className="relative aspect-[16/7] overflow-hidden rounded-lg bg-slate-100"><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 45vw, 22vw" className="object-cover" /></span>)}</Link>}
    </div>
  </article>;
}

function feeCategoryLabel(category: string, customCategory: string | null) {
  if (category === "other") return customCategory || "Other fee";
  const labels: Record<string, string> = { tuition: "Tuition", registration: "Registration", books: "Books & learning materials", uniform: "Uniform", transport: "Transport", boarding: "Boarding" };
  return labels[category] ?? category.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function feeAmount(amount: number, currency: string) {
  if (currency.toUpperCase() === "NGN") return formatNaira(amount);
  try { return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString("en-NG")}`; }
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function FeesPage({ school }: { school: SchoolRecord }) {
  const fees = school.feeDetails ?? [];
  const years = Array.from(new Set(fees.map((fee) => fee.academicYear))).sort((a, b) => b.localeCompare(a));
  if (!fees.length) return <EmptyState icon={CircleDollarSign} title="Fee information has not been provided yet" description="Contact the school for its current charges, payment dates and a written breakdown." compact />;
  return <div className="space-y-3">
    {years.map((year) => {
      const items = fees.filter((fee) => fee.academicYear === year);
      const updatedAt = items.map((fee) => fee.updatedAt).sort().at(-1);
      const updatedLabel = updatedAt ? formatDate(updatedAt) : null;
      return <ContentCard key={year}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.11em] text-emerald-800">Academic year</p><h3 className="mt-1 text-lg font-extrabold text-[#18344d]">{year}</h3></div>
          <div className="text-right"><span className="rounded-full bg-[#edf4ef] px-2.5 py-1.5 text-[11px] font-bold text-emerald-950">{items.length} {items.length === 1 ? "charge" : "charges"}</span>{updatedLabel && <p className="mt-2 text-[10px] text-slate-500">Schedule updated {updatedLabel}</p>}</div>
        </div>
        <ul className="divide-y divide-slate-100">
          {items.map((fee) => <li key={fee.id} className="grid gap-2 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0"><h4 className="text-sm font-extrabold text-slate-800">{feeCategoryLabel(fee.category, fee.customCategory)}</h4><p className="mt-1 text-xs text-slate-500">{[fee.className, fee.level, fee.term].filter(Boolean).join(" · ") || "Billing period not specified"}</p>{fee.notes && <p className="mt-2 max-w-2xl whitespace-pre-line text-xs leading-5 text-slate-600">{fee.notes}</p>}</div>
            <p className="text-base font-extrabold tabular-nums text-[#18344d]">{feeAmount(fee.amount, fee.currency)}</p>
          </li>)}
        </ul>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500"><ShieldCheck className="size-3.5" aria-hidden="true" />Fees supplied by the school · confirm the current schedule directly.</p>
      </ContentCard>;
    })}
    <ContentCard className="bg-[#fffdf8]">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#18344d]"><CircleDollarSign className="size-4 text-amber-700" aria-hidden="true" />Before you pay</h3>
      <ul className="mt-2 grid gap-x-5 gap-y-1.5 text-xs leading-5 text-slate-600 sm:grid-cols-2"><li>Ask what books and materials are included.</li><li>Confirm term payment dates and late-payment rules.</li><li>Check if transport, meals or boarding are separate.</li><li>Ask which charges are one-time or refundable.</li></ul>
    </ContentCard>
  </div>;
}

function admissionStatus(school: SchoolRecord) {
  if (school.admissionStatus === "open") return { label: "Admissions listed as open", status: "Open", style: "bg-emerald-50 text-emerald-900 ring-emerald-200" };
  if (school.admissionStatus === "opening_soon") return { label: "Admissions opening soon", status: "Opening soon", style: "bg-amber-50 text-amber-950 ring-amber-200" };
  if (school.admissionStatus === "closed") return { label: "Admissions listed as closed", status: "Closed", style: "bg-slate-100 text-slate-700 ring-slate-200" };
  return { label: "Admissions information not provided", status: "Not provided", style: "bg-slate-100 text-slate-700 ring-slate-200" };
}

function AdmissionsPage({ school }: { school: SchoolRecord }) {
  const status = admissionStatus(school);
  const email = getPublicEmail(school.publicEmail);
  const phone = getPublicPhone(school.publicPhone);
  const website = getPublicWebsiteUrl(school.websiteUrl);
  const acceptingClasses = (school.classes ?? []).filter((item) => item.acceptingApplications);
  return <div className="space-y-3">
    <ContentCard>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.11em] text-slate-500">Current status</p><h3 className="mt-1 text-lg font-extrabold text-[#18344d]">{status.label}</h3></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${status.style}`}>{status.status}</span></div>
      {school.admissionDescription ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{school.admissionDescription}</p> : <p className="mt-3 text-xs leading-5 text-slate-600">Admission dates and process have not been provided. Contact the school to confirm its current intake and how to apply.</p>}
      {acceptingClasses.length > 0 && <div className="mt-4 border-t border-slate-100 pt-3"><h4 className="text-xs font-bold text-slate-700">Classes the school marked as accepting applications</h4><ul className="mt-2 flex flex-wrap gap-2">{acceptingClasses.map((item) => <li key={item.id} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-950">{item.level ? `${item.level} · ` : ""}{item.name}</li>)}</ul></div>}
      <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500"><CalendarDays className="mt-0.5 size-3.5 shrink-0 text-emerald-800" aria-hidden="true" />Availability can change. Confirm the intake and deadlines directly with the school.</p>
      {school.admissionsAvailable && <Link href={`/school/${encodeURIComponent(school.slug)}/apply`} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-extrabold text-white hover:bg-emerald-900"><FileText className="size-4" />Apply through Skulena</Link>}
    </ContentCard>

    <ContentCard>
      <h3 className="text-sm font-extrabold text-[#18344d]">What families may need to prepare</h3>
      {school.admissionRequirements?.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{school.admissionRequirements.map((requirement) => <li key={requirement} className="flex min-w-0 items-start gap-2 rounded-xl bg-[#f7f9f7] p-3 text-xs leading-5 text-slate-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />{requirement}</li>)}</ul> : <p className="mt-2 text-xs leading-5 text-slate-600">The school has not published an admissions checklist.</p>}
    </ContentCard>

    {(phone || email || website) ? <ContentCard>
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf4ef] text-emerald-900"><MessageCircle className="size-4" aria-hidden="true" /></span><div><h3 className="text-sm font-extrabold text-[#18344d]">Ask the school directly</h3><p className="mt-1 text-xs leading-5 text-slate-600">For general enquiries, use a public contact method. Application messages stay securely attached to an application submitted through Skulena.</p></div></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {phone && <a href={phone.href} className="flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-emerald-300"><Phone className="size-4 text-emerald-800" aria-hidden="true" />Call {phone.label}</a>}
        {email && <a href={`mailto:${email}`} className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-emerald-300"><Mail className="size-4 shrink-0 text-emerald-800" aria-hidden="true" /><span className="truncate">Email {email}</span></a>}
        {website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-emerald-300"><Globe2 className="size-4 text-emerald-800" aria-hidden="true" />Visit school website <ArrowUpRight className="size-3.5" aria-hidden="true" /></a>}
      </div>
    </ContentCard> : <EmptyState icon={MessageCircle} title="Direct contact details are not published yet" description="No public phone number, email address or website is available for this school." compact />}
  </div>;
}

function PhotosPage({ profile }: { profile: SchoolProfileDetails }) {
  return <div className="space-y-3">
    {profile.media.length ? <ContentCard><ProfileGallery media={profile.media} /></ContentCard> : <EmptyState icon={School} title="No school photos are available yet" description="Approved school photos and videos will appear here when available." compact />}
    {profile.media.length > 0 && <p className="flex items-start gap-2 rounded-xl bg-[#edf4ef] p-3 text-[11px] leading-5 text-slate-600"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-800" aria-hidden="true" />Only school media approved for public display appears here. Media verification is shown on an item only when a verified record exists.</p>}
  </div>;
}

function ReviewsPage({ school }: { school: SchoolRecord }) {
  const reviews = school.publicReviews ?? [];
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  if (!reviews.length) return <EmptyState icon={MessageCircle} title="No parent reviews yet" description="When a review is approved for publication, it will appear here." compact />;
  return <div className="space-y-3">
    <ContentCard><div className="flex flex-wrap items-center gap-3"><span className="flex items-center gap-1 text-xl font-extrabold tabular-nums text-[#18344d]">{average.toFixed(1)}<Star className="size-4 fill-amber-400 text-amber-500" aria-hidden="true" /></span><span className="text-xs text-slate-600">From {reviews.length} published {reviews.length === 1 ? "review" : "reviews"}</span></div></ContentCard>
    {reviews.map((review) => <ContentCard key={review.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-emerald-800">Published review</p><h3 className="mt-1 text-sm font-extrabold text-[#18344d]">{review.title || "A family’s experience"}</h3></div><span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-950" aria-label={`${review.rating} out of 5 stars`}>{review.rating}/5 <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden="true" /></span></div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{review.body}</p><time dateTime={review.createdAt} className="mt-3 block text-[11px] text-slate-500">{formatDate(review.createdAt)}</time>
    </ContentCard>)}
  </div>;
}

export function SchoolProfileContent({ section, school, profile }: { section: SchoolProfileSection; school: SchoolRecord; profile: SchoolProfileDetails }) {
  if (section === "overview") return <OverviewPage school={school} profile={profile} />;
  const headings = {
    facilities: <><SectionHeading eyebrow="Spaces & support" title="Facilities" id="facilities-heading" description="Facilities listed by the school, with evidence shown only when it applies to that specific facility." /><FacilitiesPage school={school} /></>,
    fees: <><SectionHeading eyebrow="Plan your budget" title="Fees & costs" id="fees-heading" description="Review the published charges, then confirm the complete current schedule with the school before paying." /><FeesPage school={school} /></>,
    admissions: <><SectionHeading eyebrow="Your next step" title="Admissions & contact" id="admissions-heading" description="Check the school’s published intake information and contact it directly through a public channel." /><AdmissionsPage school={school} /></>,
    photos: <><SectionHeading eyebrow="Take a closer look" title="Photos & videos" id="photos-heading" description="School-submitted media approved for public display." /><PhotosPage profile={profile} /></>,
    reviews: <><SectionHeading eyebrow="Family experiences" title="Parent reviews" id="reviews-heading" description="Reviews published for this school. Reviewer identity is not displayed unless the public record supports it." /><ReviewsPage school={school} /></>,
    overview: null,
  } satisfies Record<SchoolProfileSection, React.ReactNode>;
  return <section className="scroll-mt-32 space-y-4" id={section}>{headings[section]}</section>;
}
