import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SearchBox } from "@/components/site/search-box";
import { Button } from "@/components/ui/button";
import { SchoolCard } from "@/components/schools/school-card";
import { getPublicSchools } from "@/lib/schools/public-schools";

export const metadata: Metadata = {
  title: "Schools in Nigeria",
  description: "Browse published school profiles across Nigeria on Skulena.",
};

export default async function Home() {
  const schools = await getPublicSchools();

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header />
      <main id="main-content" className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-emerald-700">School directory</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[#0e2946] sm:text-4xl">Schools in Nigeria</h1>
            <p className="mt-2 text-sm text-slate-600" role="status" aria-live="polite">
              {schools.length} published {schools.length === 1 ? "school" : "schools"}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/for-schools/register">List your school <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
        </div>

        <SearchBox compact className="mt-6 max-w-3xl" />

        {schools.length ? (
          <section aria-label="Published schools" className="mt-8 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => <SchoolCard key={school.slug} school={school} />)}
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center">
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
