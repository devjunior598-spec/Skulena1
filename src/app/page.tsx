import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookmarkCheck, Building2, FileSearch, Search } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SearchBox } from "@/components/site/search-box";
import { Button } from "@/components/ui/button";
import { SchoolCard } from "@/components/schools/school-card";
import { getPublicSchools } from "@/lib/schools/public-schools";

export const metadata: Metadata = {
  title: "Schools in Nigeria",
  description: "Explore Nigerian school profiles, fees, facilities and admissions in one place with Skulena.",
};

const features = [
  { icon: FileSearch, title: "Explore school profiles", detail: "See classes, locations, photos and facilities." },
  { icon: Building2, title: "Understand school fees", detail: "Review the fees schools publish for families." },
  { icon: BookmarkCheck, title: "Save and apply", detail: "Keep favourites and apply when admissions are open." },
];

export default async function Home() {
  const schools = await getPublicSchools();

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header />
      <main id="main-content" className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-9">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">School directory</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0e2946] sm:text-3xl">Schools in Nigeria</h1>
            <p className="mt-1 text-sm text-slate-600" role="status" aria-live="polite">
              {schools.length} published {schools.length === 1 ? "school" : "schools"}
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/for-schools/register">List your school <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
        </div>

        <section aria-labelledby="skulena-features" className="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="skulena-features" className="text-sm font-extrabold text-[#0e2946]">What you can do on Skulena</h2>
            <p className="text-xs text-slate-500">A clearer way to choose and connect with schools.</p>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800"><Icon className="size-4" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold text-[#0e2946]">{title}</h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-600">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SearchBox compact className="mt-4 max-w-3xl" />

        {schools.length ? (
          <section aria-label="Published schools" className="mt-5 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {schools.map((school) => <SchoolCard key={school.slug} school={school} compact />)}
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <Search className="mx-auto size-9 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-extrabold text-[#0e2946]">No published schools yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">School profiles will appear here after they are reviewed and published.</p>
            <Button asChild className="mt-6"><Link href="/for-schools/register">Register a school <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
