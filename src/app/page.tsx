import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Check, ClipboardCheck, GraduationCap, Heart, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MobileNav } from "@/components/site/mobile-nav";
import { SearchBox } from "@/components/site/search-box";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SchoolCard } from "@/components/schools/school-card";
import { getPublicSchools } from "@/lib/schools/public-schools";

const quickFilters = [
  { label: "Near me", icon: MapPin }, { label: "Nursery", icon: Sparkles }, { label: "Primary", icon: BookOpen },
  { label: "Secondary", icon: GraduationCap }, { label: "Boarding", icon: ShieldCheck }, { label: "Special needs", icon: Heart },
];

const locations = [
  { name: "Ibadan", area: "Oyo State", detail: "Explore 4 sample schools", tint: "bg-emerald-50 text-emerald-800" },
  { name: "Lagos", area: "Lagos State", detail: "No demo listings yet", tint: "bg-sky-50 text-sky-800" },
  { name: "Abuja", area: "FCT", detail: "No demo listings yet", tint: "bg-amber-50 text-amber-800" },
];

export default async function Home() {
  const featuredSchools = (await getPublicSchools()).slice(0, 3);
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main-content">
        <section className="relative overflow-hidden bg-[#f3f9f7]">
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-24 lg:pt-20">
            <div className="relative z-10 flex min-w-0 flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-extrabold text-emerald-800 shadow-sm">
                <BadgeCheck className="size-4" /> Clear information. Confident decisions.
              </div>
              <h1 className="max-w-3xl text-balance text-[2.75rem] font-extrabold leading-[1.03] tracking-[-0.055em] text-[#0e2946] sm:text-6xl lg:text-7xl">Find the right school for your child.</h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">Explore verified schools, see real facilities, compare fees and apply—all in one place.</p>
              <SearchBox className="mt-8 max-w-2xl" />
              <div className="mt-4 flex flex-wrap gap-2 pb-2" aria-label="Quick filters">
                {quickFilters.map(({ label, icon: Icon }) => (
                  <Link key={label} href={label === "Near me" ? "/schools?near=true" : label === "Boarding" ? "/schools?type=Boarding" : label === "Special needs" ? "/schools?special=true" : `/schools?level=${label}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"><Icon className="size-3.5" />{label}</Link>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">Demo preview: fictional schools, sample fees and verification records. Photos are illustrative stock images. Location preview: Ibadan.</p>
            </div>
            <div className="relative min-h-72 sm:min-h-96 lg:min-h-132">
              <div className="absolute inset-0 overflow-hidden rounded-[2.25rem] bg-slate-200 shadow-[0_35px_80px_-40px_rgba(14,41,70,0.5)]">
                <Image src="/images/demo/classroom.jpg" alt="Illustrative stock photo of children learning in a classroom" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e2946]/45 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/30 bg-white/92 p-4 shadow-xl backdrop-blur-md">
                  <div><p className="text-xs font-semibold text-slate-500">A place to grow</p><p className="mt-0.5 font-extrabold text-[#0e2946]">Big possibilities. Bright futures.</p></div>
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 sm:inline-flex"><BookOpen className="size-3.5" /> Every child matters</span>
                </div>
              </div>
              <div className="absolute -left-5 top-12 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 lg:block">
                <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-100 text-sky-700"><ClipboardCheck className="size-5" /></span><div><p className="text-xs text-slate-500">Compare clearly</p><p className="text-sm font-extrabold text-[#0e2946]">Fees & facilities</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-18 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex items-end justify-between gap-6">
              <SectionHeading eyebrow="Discover · Sample listings" title="Your next chapter starts here" description="Explore a selection of demo schools in Ibadan, with the details that matter to your family." />
              <Button variant="outline" asChild className="hidden sm:inline-flex"><Link href="/schools">View all schools <ArrowRight className="size-4" /></Link></Button>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredSchools.map((school) => <SchoolCard key={school.slug} school={school} />)}
            </div>
            <Button variant="outline" asChild className="mt-6 w-full sm:hidden"><Link href="/schools">View all schools <ArrowRight className="size-4" /></Link></Button>
          </div>
        </section>

        <section className="border-t border-slate-100 py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <SectionHeading eyebrow="Every stage matters" title="A school for their next step" description="From first friendships to the confidence to take on the world." />
            <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
              {[
                { name: "Nursery", description: "A gentle start. A world of curiosity.", icon: Sparkles, href: "/schools?level=Nursery" },
                { name: "Primary", description: "Strong foundations for a bright future.", icon: BookOpen, href: "/schools?level=Primary" },
                { name: "Secondary", description: "Space to discover who they can become.", icon: GraduationCap, href: "/schools?level=Secondary" },
                { name: "Special needs support", description: "Learning that puts their individual needs first.", icon: Heart, href: "/schools?special=true" },
              ].map(({ name, description, icon: Icon, href }) => <Link key={name} href={href} className="group flex items-center gap-4 border-b border-slate-200 py-6"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-800"><Icon className="size-5" /></span><div className="flex-1"><h3 className="text-lg font-extrabold">{name}</h3><p className="mt-1 text-sm text-slate-600">{description}</p></div><ArrowRight className="size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" /></Link>)}
            </div>
          </div>
        </section>

        <section className="bg-[#f8fafb] py-18 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <SectionHeading eyebrow="Simple by design" title="Your school search, made easier" description="Move from a broad search to a confident shortlist in three clear steps." align="center" />
            <div className="relative mt-12 grid gap-5 md:grid-cols-3">
              {[
                { n: "01", icon: Search, title: "Search your way", text: "Use a school name, neighbourhood or city, then refine the results around what matters to your family." },
                { n: "02", icon: ClipboardCheck, title: "Compare the details", text: "Review fees, curricula, facilities and verification information side by side without the guesswork." },
                { n: "03", icon: GraduationCap, title: "Visit or apply", text: "Contact schools, schedule a campus visit and keep each application organised in one place." },
              ].map(({ n, icon: Icon, title, text }) => (
                <div key={n} className="relative rounded-3xl border border-slate-200 bg-white p-7">
                  <span className="absolute right-6 top-5 text-4xl font-black text-slate-100">{n}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon className="size-5" /></span>
                  <h3 className="mt-6 text-xl font-extrabold tracking-tight text-[#0e2946]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-18 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-slate-100">
              <Image src="/images/demo/library.jpg" alt="Illustrative stock photo of a library" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-[#0e2946]/92 p-5 text-white backdrop-blur">
                <p className="text-sm font-bold">We show the source of every important claim.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-full bg-white/12 px-2.5 py-1">School provided</span><span className="rounded-full bg-sky-400/25 px-2.5 py-1">Document verified</span><span className="rounded-full bg-emerald-400/25 px-2.5 py-1">Physically verified</span></div>
              </div>
            </div>
            <div className="lg:pl-10">
              <SectionHeading eyebrow="Skulena Verified" title="Know what has actually been checked" description="A polished profile is helpful. Knowing where the information came from is better. Skulena clearly labels school-provided details, document checks and physical inspections." />
              <ul className="mt-7 space-y-4">
                {["Verification status shown at a glance", "Facility details linked to their evidence", "Clear dates and scope for completed checks"].map((text) => <li key={text} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-3.5" /></span>{text}</li>)}
              </ul>
              <Button variant="navy" asChild className="mt-8"><Link href="/school/greenfield-international-school">See a verified profile <ArrowRight className="size-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section id="locations" className="scroll-mt-18 bg-[#eef6fb] py-18 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <SectionHeading eyebrow="Explore nearby" title="Browse schools by location" description="See options in fast-growing school communities, then narrow down by area." />
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {locations.map((location) => (
                <Link key={location.name} href={`/schools/${location.name.toLowerCase()}`} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300">
                  <span className={`grid size-13 shrink-0 place-items-center rounded-2xl ${location.tint}`}><MapPin className="size-6" /></span>
                  <div className="flex-1"><p className="text-xl font-extrabold">{location.name}</p><p className="mt-1 text-sm text-slate-600">{location.area}</p><p className="mt-3 text-xs font-medium text-slate-500">{location.detail}</p></div><ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-18 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="overflow-hidden rounded-[2rem] bg-[#0e2946] px-6 py-12 text-center text-white sm:px-12 sm:py-16 lg:text-left">
              <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 lg:flex-row lg:items-end">
                <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300">For school leaders</p><h2 className="mt-3 max-w-2xl text-balance text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Help more families discover what makes your school special.</h2><p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Create a complete profile, organise your media and manage enquiries, visits and applications.</p></div>
                <Button size="lg" asChild className="shrink-0 bg-white text-[#0e2946] hover:bg-emerald-50"><Link href="/for-schools">List your school <ArrowRight className="size-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
