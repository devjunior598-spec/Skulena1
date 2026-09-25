import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, BookOpen, Check, ClipboardCheck, GraduationCap, Heart, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SearchBox } from "@/components/site/search-box";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SchoolCard } from "@/components/schools/school-card";
import { getPublicSchools } from "@/lib/schools/public-schools";

const quickFilters = [
  { label: "Nursery", icon: Sparkles }, { label: "Primary", icon: BookOpen },
  { label: "Secondary", icon: GraduationCap }, { label: "Boarding", icon: ShieldCheck }, { label: "Special needs", icon: Heart },
];

export default async function Home() {
  const publishedSchools = await getPublicSchools();
  const featuredSchools = publishedSchools.slice(0, 3);
  const locations = [...new Set(publishedSchools.map((school) => school.city).filter(Boolean))].slice(0, 3);
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main-content">
        <section className="relative overflow-hidden bg-[#f3f9f7]">
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-24 lg:pt-20">
            <div className="relative z-10 flex min-w-0 flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-extrabold text-emerald-800 shadow-sm">
                <BadgeCheck className="size-4" /> A clearer school search for Nigerian families
              </div>
              <h1 className="max-w-3xl text-balance text-[2.75rem] font-extrabold leading-[1.03] tracking-[-0.055em] text-[#0e2946] sm:text-6xl lg:text-7xl">Find a school that feels right for your family.</h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">Explore Nigerian school profiles and compare location, learning stage, fees and facilities in one place.</p>
              <SearchBox className="mt-8 max-w-2xl" />
              <div className="mt-4 flex flex-wrap gap-2 pb-2" aria-label="Quick filters">
                {quickFilters.map(({ label, icon: Icon }) => (
                  <Link key={label} href={label === "Boarding" ? "/schools?type=Boarding" : label === "Special needs" ? "/schools?special=true" : `/schools?level=${label}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"><Icon className="size-3.5" />{label}</Link>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">Listings appear as schools publish their profiles. Confirm current fees and admissions details directly with each school.</p>
            </div>
            <div className="relative flex items-center">
              <figure className="relative aspect-[3/2] w-full overflow-hidden rounded-[2.25rem] border border-white bg-slate-100 shadow-[0_35px_80px_-40px_rgba(14,41,70,0.42)]">
                <Image
                  src="/images/schools/nigerian-primary-classroom.jpg"
                  alt="Illustrative Nigerian primary-school classroom with pupils learning together"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover"
                />
                <figcaption className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#0e2946] shadow-sm backdrop-blur-sm">
                  An illustrative classroom scene
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="py-18 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex items-end justify-between gap-6">
            <SectionHeading eyebrow="Discover schools" title="Start with what matters to you" description="Compare published profiles by location, learning stage, curriculum, fees in naira and facilities." />
              <Button variant="outline" asChild className="hidden sm:inline-flex"><Link href="/schools">View all schools <ArrowRight className="size-4" /></Link></Button>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredSchools.length ? featuredSchools.map((school) => <SchoolCard key={school.slug} school={school} />) : <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 sm:col-span-2 lg:col-span-3"><h3 className="text-lg font-extrabold text-[#0e2946]">School listings are being added</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">There are no published school profiles available yet. School leaders can create a profile to get started.</p><Button asChild className="mt-5"><Link href="/for-schools/register">List your school <ArrowRight className="size-4" /></Link></Button></div>}
            </div>
            <Button variant="outline" asChild className="mt-6 w-full sm:hidden"><Link href="/schools">View all schools <ArrowRight className="size-4" /></Link></Button>
          </div>
        </section>

        <section className="border-t border-slate-100 py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <SectionHeading eyebrow="Every stage matters" title="Choose for the stage they’re at" description="From the first classroom to the next big step, start with the kind of learning your child needs now." />
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

        <section className="overflow-hidden bg-[#f8fafb] py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:px-10">
            <figure className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-slate-100 shadow-[0_28px_65px_-42px_rgba(14,41,70,0.5)]">
              <Image
                src="/images/schools/nigerian-school-library.jpg"
                alt="Illustrative Nigerian primary-school library with pupils reading"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <figcaption className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#0e2946] shadow-sm backdrop-blur-sm">
                An illustrative school-library scene
              </figcaption>
            </figure>
            <div className="lg:py-8">
              <SectionHeading
                eyebrow="Learning spaces"
                title="A feel for everyday school life"
                description="Explore the facilities schools share on their profiles—from libraries to play spaces—then contact each school to confirm what is available."
              />
              <Button variant="navy" asChild className="mt-7">
                <Link href="/schools">Browse school profiles <ArrowRight className="size-4" /></Link>
              </Button>
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
                { n: "03", icon: GraduationCap, title: "Make an informed choice", text: "Contact the school directly to confirm current fees, admissions information and visit arrangements." },
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
            <div className="relative grid min-h-72 content-center gap-4 overflow-hidden rounded-[2rem] bg-[#0e2946] p-6 text-white sm:min-h-96 sm:p-9">
              <div aria-hidden="true" className="absolute -right-12 -top-12 size-56 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="relative"><p className="text-sm font-bold">Clear information. Clear verification.</p><p className="mt-2 max-w-md text-sm leading-6 text-slate-300">Understand what a school shares and what has been independently checked.</p></div>
              <div className="relative grid gap-3">{[{ title: "School provided", text: "Information shared by the school" }, { title: "Document verified", text: "A named document was reviewed" }, { title: "Physically verified", text: "A named in-person check was completed" }].map((item) => <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><span className="grid size-9 place-items-center rounded-full bg-emerald-300/15 text-emerald-200"><Check className="size-4" /></span><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-slate-300">{item.text}</p></div></div>)}</div>
            </div>
            <div className="lg:pl-10">
              <SectionHeading eyebrow="Skulena Verified" title="Know what has actually been checked" description="A polished profile is helpful. Knowing where the information came from is better. Skulena clearly labels school-provided details, document checks and physical inspections." />
              <ul className="mt-7 space-y-4">
                {["Verification status shown at a glance", "Facility details linked to their evidence", "Clear dates and scope for completed checks"].map((text) => <li key={text} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-3.5" /></span>{text}</li>)}
              </ul>
              <Button variant="navy" asChild className="mt-8"><Link href="/about#verification">How verification works <ArrowRight className="size-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section id="locations" className="scroll-mt-18 bg-[#eef6fb] py-18 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <SectionHeading eyebrow="Explore by location" title="Find schools near you" description="Browse published profiles by city and area." />
            {locations.length > 0 ? <div className="mt-9 grid gap-4 md:grid-cols-3">{locations.map((location) => <Link key={location} href={`/schools/${location.toLowerCase().replaceAll(" ", "-")}`} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300"><span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><MapPin className="size-6" /></span><div className="flex-1"><p className="text-xl font-extrabold">{location}</p><p className="mt-1 text-sm text-slate-600">Published school profiles</p></div><ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" /></Link>)}</div> : <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">School locations will appear here as profiles are published.</p>}
          </div>
        </section>

        <section className="py-18 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="overflow-hidden rounded-[2rem] bg-[#0e2946] px-6 py-12 text-center text-white sm:px-12 sm:py-16 lg:text-left">
              <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 lg:flex-row lg:items-end">
                <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300">For school leaders</p><h2 className="mt-3 max-w-2xl text-balance text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Make it easier for the right families to find your school.</h2><p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Share your school’s profile, the learning you offer and the details families need to take their next step.</p></div>
                <Button size="lg" asChild className="shrink-0 bg-white text-[#0e2946] hover:bg-emerald-50"><Link href="/for-schools">List your school <ArrowRight className="size-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
