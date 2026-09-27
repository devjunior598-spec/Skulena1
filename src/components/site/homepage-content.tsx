import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  Check,
  CircleDollarSign,
  Compass,
  FileText,
  Heart,
  MapPin,
  School as SchoolIcon,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { School } from "@/data/schools";
import { SchoolCard } from "@/components/schools/school-card";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/site/search-box";
import type { getPublicSchoolPayStatus } from "@/lib/schools/public-schools";

export const HOME_SCHOOL_LIMIT = 6;

type SchoolPayStatus = Awaited<ReturnType<typeof getPublicSchoolPayStatus>>;

const homepageFeatures = [
  { title: "Explore schools", detail: "Profiles, classes and facilities.", href: "/schools", icon: Compass },
  { title: "Apply online", detail: "Apply when a school opens intake.", href: "/schools", icon: FileText },
  { title: "Book a visit", detail: "Request a visit from your application.", href: "/schools", icon: CalendarDays },
  { title: "SchoolPay", detail: "For eligible families, when available.", href: "#schoolpay", icon: WalletCards },
  { title: "Save a shortlist", detail: "Keep your favourite schools together.", href: "/schools", icon: Heart },
];

function HeroIllustration() {
  return (
    <div role="img" aria-label="Skulena illustration of families exploring school information" className="relative mx-auto min-h-[330px] w-full max-w-[570px] overflow-hidden rounded-[2rem] border border-[#dce9df] bg-[linear-gradient(135deg,#dcefe2_0%,#f5f5e9_54%,#deedf3_100%)] shadow-[0_34px_80px_-48px_rgba(14,41,70,0.38)] sm:min-h-[405px] lg:min-h-[480px]">
      <div aria-hidden="true" className="absolute -right-14 -top-20 size-72 rounded-full border-[1px] border-white/80 sm:size-96" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-24 size-80 rounded-full bg-[#b5dec4]/55 blur-2xl sm:size-[26rem]" />
      <div aria-hidden="true" className="absolute right-[12%] top-[14%] size-3 rounded-full bg-emerald-600/70 shadow-[0_0_0_8px_rgba(255,255,255,.45)]" />
      <div aria-hidden="true" className="absolute left-[18%] top-[27%] size-2.5 rounded-full bg-sky-700/70 shadow-[0_0_0_7px_rgba(255,255,255,.55)]" />

      <div className="absolute inset-0 grid place-items-center p-7 sm:p-10">
        <div className="relative grid size-[220px] place-items-center rounded-full border border-white/90 bg-white/40 shadow-[0_20px_60px_-35px_rgba(14,41,70,0.3)] backdrop-blur-sm sm:size-[300px]">
          <div aria-hidden="true" className="absolute inset-5 rounded-full border border-dashed border-emerald-900/15 sm:inset-7" />
          <div className="relative grid size-36 place-items-center rounded-[2rem] border border-white bg-white/95 text-emerald-800 shadow-[0_24px_54px_-30px_rgba(14,41,70,0.35)] sm:size-48 sm:rounded-[2.5rem]">
            <SchoolIcon className="size-16 stroke-[1.5] sm:size-24" aria-hidden="true" />
            <div aria-hidden="true" className="absolute -bottom-2 left-1/2 h-3 w-24 -translate-x-1/2 rounded-full bg-emerald-900/10 blur-sm sm:w-32" />
          </div>
          <span className="absolute left-1 top-[31%] grid size-12 place-items-center rounded-2xl border border-white bg-[#fffdf7] text-[#0e2946] shadow-lg sm:-left-2 sm:size-16"><UsersRound className="size-6 sm:size-7" aria-hidden="true" /></span>
          <span className="absolute right-0 top-[24%] grid size-12 place-items-center rounded-2xl border border-white bg-[#f4fbf5] text-emerald-800 shadow-lg sm:-right-3 sm:size-16"><ShieldCheck className="size-6 sm:size-7" aria-hidden="true" /></span>
          <span className="absolute bottom-[13%] left-[10%] grid size-12 place-items-center rounded-2xl border border-white bg-[#f5f9fc] text-sky-800 shadow-lg sm:bottom-[9%] sm:left-[7%] sm:size-16"><BookOpenCheck className="size-6 sm:size-7" aria-hidden="true" /></span>
          <span className="absolute bottom-[12%] right-[8%] grid size-12 place-items-center rounded-2xl border border-white bg-[#fffaf0] text-amber-800 shadow-lg sm:bottom-[8%] sm:right-[6%] sm:size-16"><Heart className="size-6 sm:size-7" aria-hidden="true" /></span>
        </div>
      </div>

      <div className="absolute left-3 top-4 max-w-[185px] rounded-2xl border border-white/90 bg-white/95 p-3 shadow-[0_18px_48px_-28px_rgba(14,41,70,0.45)] sm:left-6 sm:top-7 sm:max-w-[220px] sm:p-4">
        <div className="flex items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><MapPin className="size-4.5" aria-hidden="true" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Discover</p><p className="mt-0.5 text-xs font-extrabold text-[#0e2946] sm:text-sm">Schools in one place</p></div></div>
      </div>

      <div className="absolute bottom-4 right-3 max-w-[205px] rounded-2xl border border-white/90 bg-white/95 p-3 shadow-[0_18px_48px_-28px_rgba(14,41,70,0.45)] sm:bottom-7 sm:right-6 sm:max-w-[245px] sm:p-4">
        <div className="flex items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef5f8] text-[#0e4960]"><BadgeCheck className="size-4.5" aria-hidden="true" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Trust, made clear</p><p className="mt-0.5 text-xs font-extrabold text-[#0e2946] sm:text-sm">See what was checked</p></div></div>
      </div>
    </div>
  );
}

function Hero({ schoolPay }: { schoolPay: SchoolPayStatus }) {
  return (
    <section aria-labelledby="home-title" className="relative overflow-hidden bg-[#f7f9f5]">
      <div aria-hidden="true" className="absolute -left-44 top-[-14rem] size-[34rem] rounded-full bg-emerald-100/45 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-4 pb-16 pt-10 sm:px-7 sm:pb-20 sm:pt-14 lg:grid-cols-[1.03fr_.97fr] lg:gap-12 lg:px-9 lg:pb-24 lg:pt-16">
        <div className="relative z-10 max-w-[680px]">
          <p className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3.5 py-2 text-[11px] font-extrabold tracking-[0.01em] text-emerald-950 shadow-sm sm:text-xs"><ShieldCheck className="size-4 text-emerald-700" aria-hidden="true" />A safer, easier way to find and join the right school</p>
          <h1 id="home-title" className="mt-6 max-w-[650px] text-[2.65rem] font-black leading-[1.04] tracking-[-0.065em] text-[#0e2946] sm:text-6xl lg:text-[4.4rem]">Find the right school <span className="text-emerald-700">for your child.</span></h1>
          <div className="mt-7 border-l-[3px] border-emerald-500 pl-4 sm:mt-8 sm:pl-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 sm:text-[11px]">Skulena SchoolPay · for eligible families, when available</p>
            <p className="mt-1.5 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[#0e2946] sm:text-2xl">School fees today.<br />Pay over time.</p>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">Discover real school profiles, compare published fees and apply when a school has opened admissions. SchoolPay is designed for eligible families; applications are <strong className="font-bold text-slate-700">{schoolPay.available ? "subject to provider assessment and availability" : "not available yet"}</strong>.</p>
          <div className="mt-6 max-w-2xl"><SearchBox className="rounded-2xl border-slate-200/90 p-1.5 sm:p-2" /></div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-700" aria-hidden="true" />Only published profiles</span><span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-700" aria-hidden="true" />School fees shown when provided</span></div>
          <Link href="/for-schools/register" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-extrabold text-[#0e2946] transition hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">List your school <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <HeroIllustration />
      </div>
    </section>
  );
}

function FeatureStrip() {
  return (
    <nav aria-label="Skulena features" className="relative z-10 mx-auto -mt-7 max-w-7xl px-4 sm:px-7 lg:px-9">
      <ul className="grid grid-cols-2 gap-2 rounded-[1.5rem] border border-slate-200/80 bg-white p-2 shadow-[0_20px_55px_-34px_rgba(14,41,70,0.35)] sm:grid-cols-3 sm:gap-2.5 sm:p-3 lg:grid-cols-5">
        {homepageFeatures.map(({ title, detail, href, icon: Icon }) => (
          <li key={title}>
            <Link href={href} className="group flex min-h-[88px] items-start gap-2.5 rounded-xl px-2.5 py-3 transition hover:bg-[#f4f8f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:min-h-[92px] sm:gap-3 sm:px-3.5 sm:py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-100 sm:size-10"><Icon className="size-[18px]" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block text-xs font-extrabold leading-5 text-[#0e2946] sm:text-[13px]">{title}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500 sm:text-xs">{detail}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SchoolListings({ schools, savedSchoolIds, showSave }: { schools: School[]; savedSchoolIds: string[]; showSave: boolean }) {
  return (
    <section id="schools" aria-labelledby="schools-title" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 pt-16 sm:px-7 sm:pb-20 sm:pt-20 lg:px-9">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 sm:text-[11px]">School directory</p><h2 id="schools-title" className="mt-2 text-2xl font-black tracking-[-0.045em] text-[#0e2946] sm:text-3xl">Explore published schools</h2><p className="mt-2 text-sm leading-6 text-slate-600">Start with real school profiles. Details and fees are shared by each school, and independent checks are labelled separately.</p></div>
        <Button variant="outline" asChild className="shrink-0"><Link href="/schools">View all schools <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
      </div>
      {schools.length ? (
        <>
          <p role="status" aria-live="polite" className="mt-4 text-xs font-semibold text-slate-500">{schools.length < HOME_SCHOOL_LIMIT ? `${schools.length} published ${schools.length === 1 ? "school" : "schools"} ready to explore` : "Showing recently published school profiles"}</p>
          <div className="mt-5 grid grid-cols-1 justify-items-start gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {schools.map((school) => <SchoolCard key={school.slug} school={school} initialSaved={savedSchoolIds.includes(school.databaseId ?? "")} showSave={showSave} headingLevel={3} />)}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-emerald-200 bg-white px-5 py-12 text-center shadow-sm sm:px-8 sm:py-16">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><SchoolIcon className="size-7" aria-hidden="true" /></span>
          <h3 className="mt-4 text-xl font-extrabold tracking-[-0.025em] text-[#0e2946]">Schools are being added to Skulena.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">A school profile appears here after it has been reviewed and published. If you represent a school, you can start a profile now.</p>
          <Button asChild className="mt-6"><Link href="/for-schools/register">List your school <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
        </div>
      )}
    </section>
  );
}

const schoolPaySteps = [
  { title: "Apply", detail: "When applications are open, share the required family and school-fee information." },
  { title: "Review", detail: "Required information, documents and the school invoice are reviewed." },
  { title: "Receive an offer", detail: "If eligible, a configured provider would show the full amount and terms before you choose." },
  { title: "School paid", detail: "Only after an agreement is complete and funding is confirmed would approved fees go to the school." },
  { title: "Repay", detail: "Repayments follow the schedule and terms you accepted with the provider." },
];

function SchoolPaySection({ status }: { status: SchoolPayStatus }) {
  return (
    <section id="schoolpay" aria-labelledby="schoolpay-title" className="scroll-mt-24 bg-[#0e2946] px-4 py-14 text-white sm:px-7 sm:py-18 lg:px-9 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
        <div className="flex flex-col items-start rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(40,144,96,.34),transparent_46%),linear-gradient(150deg,#153b5c,#0b213a)] p-5 shadow-[0_28px_70px_-45px_rgba(0,0,0,.7)] sm:p-8 lg:p-9">
          <p className="inline-flex min-h-8 items-center gap-2 rounded-full border border-emerald-200/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100"><CircleDollarSign className="size-4" aria-hidden="true" />Skulena SchoolPay</p>
          <h2 id="schoolpay-title" className="mt-5 text-3xl font-black leading-[1.08] tracking-[-0.05em] sm:text-4xl">School fees today.<br /><span className="text-emerald-300">Pay over time.</span></h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">SchoolPay is designed to help eligible families spread approved school fees over an agreed repayment period. If offered, funds would go directly to a participating school.</p>
          <p role="status" className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200/20 bg-amber-100/10 p-3.5 text-xs leading-5 text-amber-50"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-200" aria-hidden="true" />{status.available ? "SchoolPay feature settings are enabled. Every family remains subject to provider assessment, terms and availability; no approval is guaranteed." : "SchoolPay applications are not available yet. No financing decision, funding or repayment is active."}</p>
          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <Button variant="secondary" asChild><Link href="#schoolpay">Learn about SchoolPay <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
            <Link href="#schoolpay-steps" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-white/85 underline decoration-white/30 underline-offset-4 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">How it works</Link>
          </div>
        </div>

        <div id="schoolpay-steps" className="scroll-mt-24 rounded-[1.75rem] border border-white/10 bg-white p-5 text-[#0e2946] shadow-[0_25px_70px_-48px_rgba(0,0,0,.7)] sm:p-7 lg:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">Clear steps, no surprises</p><h3 className="mt-1.5 text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">How SchoolPay works</h3></div><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><WalletCards className="size-5" aria-hidden="true" /></span></div>
          <ol className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {schoolPaySteps.map(({ title, detail }, index) => <li key={title} className="flex min-h-[92px] gap-3 rounded-xl border border-slate-100 bg-[#f8faf9] p-3.5 sm:p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0e2946] text-xs font-black text-white">{index + 1}</span><span><span className="block text-sm font-extrabold text-[#0e2946]">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{detail}</span></span></li>)}
          </ol>
          <p id="schoolpay-disclosure" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-5 text-slate-600"><strong className="text-[#0e2946]">Important:</strong> Financing is subject to eligibility, assessment, provider terms and availability. This information is not an offer, an approval or a promise of funding.</p>
        </div>
      </div>
    </section>
  );
}

const familyBenefits = [
  { title: "Know what’s been checked", detail: "See what information was provided by a school and what Skulena has independently verified.", icon: ShieldCheck },
  { title: "A simpler process", detail: "Find, apply, communicate and track admission steps in one place when a school is accepting applications.", icon: FileText },
  { title: "More payment options", detail: "Pay schools directly. SchoolPay is for eligible families when the service is available.", icon: CircleDollarSign },
];

function Benefits() {
  return (
    <section id="how-it-works" aria-labelledby="benefits-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-7 sm:py-20 lg:px-9">
      <div className="mx-auto max-w-2xl text-center"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 sm:text-[11px]">Made for families</p><h2 id="benefits-title" className="mt-2 text-2xl font-black tracking-[-0.045em] text-[#0e2946] sm:text-3xl">A clearer way to choose a school</h2><p className="mt-2 text-sm leading-6 text-slate-600">Get useful information and next steps without guessing what has been checked or shared.</p></div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {familyBenefits.map(({ title, detail, icon: Icon }) => <article key={title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-26px_rgba(14,41,70,.5)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg sm:p-6"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-4 text-base font-extrabold text-[#0e2946]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></article>)}
      </div>
    </section>
  );
}

export function HomepageContent({ schools, schoolPay, savedSchoolIds, showSave }: {
  schools: School[];
  schoolPay: SchoolPayStatus;
  savedSchoolIds: string[];
  showSave: boolean;
}) {
  return <main id="main-content" className="overflow-hidden bg-[#fafbf9]"><Hero schoolPay={schoolPay} /><FeatureStrip /><SchoolListings schools={schools} savedSchoolIds={savedSchoolIds} showSave={showSave} /><SchoolPaySection status={schoolPay} /><Benefits /></main>;
}
