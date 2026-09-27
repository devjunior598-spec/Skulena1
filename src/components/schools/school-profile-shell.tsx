import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, CalendarDays, ChevronRight, FileCheck2, Globe2, Mail, MapPin, Phone, School, ShieldCheck, type LucideIcon } from "lucide-react";
import type { School as SchoolRecord, PublicVerificationRecord } from "@/data/schools";
import { ProfileGallery } from "@/components/schools/profile-gallery";
import { SaveButton, ShareButton } from "@/components/schools/school-actions";
import { SchoolProfileNavigation } from "@/components/schools/school-profile-navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { formatNaira } from "@/data/schools";

export const schoolProfileSections = [
  { id: "overview", label: "Overview" },
  { id: "facilities", label: "Facilities" },
  { id: "fees", label: "Fees" },
  { id: "admissions", label: "Admissions & contact" },
  { id: "photos", label: "Photos & videos" },
  { id: "reviews", label: "Parent reviews" },
] as const;

export type SchoolProfileSection = (typeof schoolProfileSections)[number]["id"];

export function schoolProfilePath(slug: string, section: SchoolProfileSection) {
  const base = `/school/${encodeURIComponent(slug)}`;
  return section === "overview" ? base : `${base}#${section}`;
}

export function getPublicWebsiteUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname === "example.com" || url.hostname.endsWith(".example.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getPublicEmail(value: string | null | undefined) {
  const email = value?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function getPublicPhone(value: string | null | undefined) {
  if (!value) return null;
  const phone = value.trim();
  const href = phone.replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(href) ? { label: phone, href: `tel:${href}` } : null;
}

function verificationScope(type: PublicVerificationRecord["type"]) {
  const names: Record<PublicVerificationRecord["type"], string> = {
    identity: "School identity",
    location: "School location",
    documents: "School documents",
    facilities: "Selected facilities",
    media: "Selected photos or videos",
  };
  return names[type];
}

function verificationLabel(record: PublicVerificationRecord) {
  if (record.method === "school_provided") return `${verificationScope(record.type)} · school-provided`;
  if (record.method === "physically_verified") return `${verificationScope(record.type)} · physically checked`;
  return `${verificationScope(record.type)} · documents reviewed`;
}

function VerificationIcon({ method, className }: { method: PublicVerificationRecord["method"]; className?: string }) {
  if (method === "physically_verified") return <BadgeCheck className={className} aria-hidden="true" />;
  if (method === "document_verified") return <FileCheck2 className={className} aria-hidden="true" />;
  return <ShieldCheck className={className} aria-hidden="true" />;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function VerificationDetails({ records }: { records: PublicVerificationRecord[] }) {
  if (!records.length) return <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-600"><ShieldCheck className="size-3.5 text-slate-500" aria-hidden="true" />School-provided profile</span>;
  const first = records[0];
  return <details className="group relative">
    <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden">
      <VerificationIcon method={first.method} className="size-3.5" />{records.length === 1 ? verificationLabel(first) : `${records.length} verification records`}<ChevronRight className="size-3.5 rotate-90 transition-transform group-open:-rotate-90" aria-hidden="true" />
    </summary>
    <div className="absolute left-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <h2 className="text-sm font-extrabold text-[#0e2946]">Verification details</h2>
      <p className="mt-1 text-xs leading-5 text-slate-600">Only the records listed here have been checked. This does not verify every detail on the profile.</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {records.map((record) => {
          const date = formatDate(record.verifiedAt);
          return <li key={record.id} className="flex gap-2.5 py-3 first:pt-0 last:pb-0">
            <VerificationIcon method={record.method} className="mt-0.5 size-4 shrink-0 text-emerald-800" />
            <span className="min-w-0"><strong className="block text-xs text-slate-800">{verificationLabel(record)}</strong>{record.publicSummary && <span className="mt-1 block text-xs leading-5 text-slate-600">{record.publicSummary}</span>}{date && <time dateTime={record.verifiedAt ?? undefined} className="mt-1 block text-[11px] text-slate-500">Recorded {date}</time>}</span>
          </li>;
        })}
      </ul>
    </div>
  </details>;
}

function publicContact(school: SchoolRecord) {
  return { website: getPublicWebsiteUrl(school.websiteUrl), email: getPublicEmail(school.publicEmail), phone: getPublicPhone(school.publicPhone) };
}

function ContactActions({ school, compact = false }: { school: SchoolRecord; compact?: boolean }) {
  const { website, email, phone } = publicContact(school);
  const styles = compact
    ? "flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
    : "flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40";
  if (!website && !email && !phone) return <p className={compact ? "rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/85" : "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600"}>The school has not published direct contact details yet.</p>;
  return <div className={compact ? "mt-3 grid gap-2" : "mt-4 grid gap-2 sm:grid-cols-2"}>
    {phone && <a href={phone.href} className={styles}><Phone className="size-4 shrink-0 text-emerald-700" aria-hidden="true" /><span className="min-w-0"><strong className="block text-xs">Call the school</strong><span className="mt-0.5 block truncate text-[11px] font-medium opacity-75">{phone.label}</span></span></a>}
    {email && <a href={`mailto:${email}`} className={styles}><Mail className="size-4 shrink-0 text-emerald-700" aria-hidden="true" /><span className="min-w-0"><strong className="block text-xs">Email the school</strong><span className="mt-0.5 block truncate text-[11px] font-medium opacity-75">{email}</span></span></a>}
    {website && <a href={website} target="_blank" rel="noopener noreferrer" className={styles}><Globe2 className="size-4 shrink-0 text-emerald-700" aria-hidden="true" /><span className="min-w-0 flex-1"><strong className="block text-xs">School website</strong><span className="mt-0.5 block truncate text-[11px] font-medium opacity-75">Official external site</span></span><ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /></a>}
  </div>;
}

function schoolFacts(school: SchoolRecord) {
  type SchoolFact = { label: string; value: string; icon: LucideIcon };
  return [
    school.schoolType ? { label: "School type", value: school.schoolType, icon: School } : null,
    school.type ? { label: "Structure", value: school.type, icon: School } : null,
    school.gender ? { label: "Gender", value: school.gender, icon: ShieldCheck } : null,
    school.yearEstablished ? { label: "Established", value: String(school.yearEstablished), icon: CalendarDays } : null,
    school.levels.length > 0 ? { label: "Learning stages", value: school.levels.join(", "), icon: BookOpen } : null,
  ].filter((fact): fact is SchoolFact => fact !== null);
}

export function SchoolProfileShell({ school, section, accountHref, children }: { school: SchoolRecord; section: SchoolProfileSection; accountHref?: string | null; children: ReactNode }) {
  const facts = schoolFacts(school);
  const contact = publicContact(school);
  const hasContact = Boolean(contact.phone || contact.email || contact.website);
  const mapUrl = school.branchLatitude != null && school.branchLongitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${school.branchLatitude},${school.branchLongitude}`
    : null;

  return <div className="min-h-screen overflow-x-clip bg-[#f7f9f7] pb-20 md:pb-0">
    <Header accountHref={accountHref} />
    <main id="main-content" className="pb-10">
      <section className="border-b border-emerald-100/80 bg-[radial-gradient(ellipse_at_top_right,rgba(218,237,226,.86),transparent_43%),linear-gradient(120deg,#f4f8f4_0%,#fffdf8_58%,#f0f5f9_100%)]">
        <div className="mx-auto max-w-7xl px-4 pb-7 pt-4 sm:px-8 sm:pb-9 sm:pt-5 lg:px-10">
          <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-semibold text-slate-500 sm:mb-5">
            <Link href="/schools" className="rounded hover:text-emerald-800 focus-visible:outline-2">Schools</Link><ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            {school.city && <><span>{school.city}</span><ChevronRight className="size-3.5 shrink-0" aria-hidden="true" /></>}
            <span aria-current="page" className="truncate text-slate-800">{school.name}</span>
          </nav>

          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,.96fr)] lg:gap-5">
            <section className="flex min-w-0 flex-col justify-center rounded-2xl border border-white/90 bg-white/90 p-5 shadow-[0_16px_40px_-32px_rgba(14,41,70,.34)] backdrop-blur sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-600">School profile</span>
                <VerificationDetails records={school.verificationRecords ?? []} />
              </div>
              <div className="mt-4 flex items-start gap-3.5 sm:mt-5 sm:gap-4">
                {school.logo ? <Image src={school.logo} alt={`${school.name} logo`} width={64} height={64} className="size-14 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-1.5 sm:size-16" /> : <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#e8f1ea] text-emerald-900 sm:size-16"><School className="size-7" aria-hidden="true" /></span>}
                <div className="min-w-0">
                  <h1 className="text-balance text-[1.8rem] font-extrabold leading-tight tracking-[-.045em] text-[#102d47] sm:text-4xl">{school.name}</h1>
                  {(school.addressLine || school.location) && <p className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-slate-600"><MapPin className="mt-1 size-4 shrink-0 text-emerald-700" aria-hidden="true" /><span>{school.addressLine || school.location}</span></p>}
                  {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950">View on map <ArrowUpRight className="size-3.5" aria-hidden="true" /></a>}
                </div>
              </div>

              {(school.levels.length > 0 || school.curriculum.length > 0) && <div className="mt-4 flex flex-wrap gap-2">
                {school.levels.map((level) => <span key={level} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"><BookOpen className="size-3.5 text-emerald-700" aria-hidden="true" />{level}</span>)}
                {school.curriculum.map((curriculum) => <span key={curriculum} className="inline-flex min-h-8 items-center rounded-full bg-[#edf4f8] px-3 py-1.5 text-xs font-semibold text-[#294761]">{curriculum}</span>)}
              </div>}
              <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-500">Profile information is shared by the school. Confirm details directly before making a decision.</p>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                <SaveButton slug={school.slug} name={school.name} />
                <ShareButton name={school.name} />
                {hasContact && <Link href="#contact" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><Mail className="size-4" aria-hidden="true" />Contact school</Link>}
              </div>
            </section>

            <div className="min-w-0 rounded-2xl border border-white/90 bg-white/85 p-1.5 shadow-[0_16px_40px_-32px_rgba(14,41,70,.34)] sm:p-2">
              <ProfileGallery media={school.media ?? []} variant="hero" />
            </div>
          </div>

          {facts.length > 0 && <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {facts.map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-xl border border-white/90 bg-white/75 px-3.5 py-3 shadow-[0_8px_24px_-22px_rgba(14,41,70,.32)] sm:px-4">
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-slate-500"><Icon className="size-3.5 shrink-0 text-emerald-700" aria-hidden="true" />{label}</dt>
              <dd className="mt-1 truncate text-sm font-extrabold text-[#18344d]" title={value}>{value}</dd>
            </div>)}
          </dl>}
        </div>
      </section>

      <div className="sticky top-[4.5rem] z-40 border-b border-slate-200 bg-white/95 shadow-[0_6px_16px_-16px_rgba(14,41,70,.45)] backdrop-blur">
        <SchoolProfileNavigation sections={schoolProfileSections} slug={school.slug} activeSection={section} anchored={section === "overview"} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-7 lg:px-10">
        <div className="min-w-0 space-y-8">{children}</div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-[8.5rem] lg:self-start">
          <section id="contact" className="scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_-30px_rgba(14,41,70,.4)] sm:p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-emerald-800">Talk to the school</p>
            <h2 className="mt-1.5 text-xl font-extrabold tracking-[-.03em] text-[#102d47]">Contact details</h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">Use a channel the school has chosen to publish. Skulena does not submit applications on the school’s behalf.</p>
            <ContactActions school={school} />
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="flex items-center gap-2 text-xs font-bold text-slate-700"><School className="size-4 text-emerald-700" aria-hidden="true" />{school.admissionStatus === "open" ? "Admissions listed as open" : school.admissionStatus === "opening_soon" ? "Admissions opening soon" : school.admissionStatus === "closed" ? "Admissions listed as closed" : "Admissions information not provided"}</p>
              {school.feeFrom > 0 && <p className="mt-3 text-xs text-slate-600">Published tuition starts at <strong className="text-[#102d47]">{formatNaira(school.feeFrom)}</strong><span className="block pt-1 text-[11px] text-slate-500">Review the full fee schedule and confirm directly.</span></p>}
              <Link href={section === "overview" ? "#admissions" : `/school/${encodeURIComponent(school.slug)}/admissions`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#102d47] px-4 text-xs font-extrabold text-white transition hover:bg-[#173d5c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102d47]">Admissions information <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_-30px_rgba(14,41,70,.4)] sm:p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-emerald-800">Find the campus</p>
            <h2 className="mt-1.5 text-lg font-extrabold text-[#102d47]">School location</h2>
            {school.addressLine || school.location ? <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin className="mt-1 size-4 shrink-0 text-emerald-700" aria-hidden="true" /><span>{school.addressLine || school.location}</span></p> : <p className="mt-2 text-sm leading-6 text-slate-600">A public address has not been added yet.</p>}
            {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-900 transition hover:bg-emerald-100">Open map <ArrowUpRight className="size-3.5" aria-hidden="true" /></a>}
            {!mapUrl && (school.addressLine || school.location) && <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />Map coordinates are not available for this campus.</p>}
          </section>
        </aside>
      </div>
    </main>
    <Footer />
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_28px_-22px_rgba(14,41,70,.45)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <SaveButton slug={school.slug} name={school.name} className="w-full" />
        {hasContact ? <a href="#contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-sm font-bold text-white hover:bg-emerald-800"><Phone className="size-4" aria-hidden="true" />Contact</a> : <Link href="#admissions" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#102d47] px-3 text-sm font-bold text-white hover:bg-[#173d5c]">Admissions</Link>}
      </div>
    </div>
  </div>;
}
