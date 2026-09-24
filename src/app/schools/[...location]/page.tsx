import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { MobileNav } from "@/components/site/mobile-nav";
import { SearchResults } from "@/components/schools/search-results";
import { getPublicSchools } from "@/lib/schools/public-schools";
import { locationFromSegments, parseSchoolFilters, type SearchParams } from "@/lib/school-search";

type LocationPageProps = {
  params: Promise<{ location: string[] }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { location } = await params;
  const parts = locationFromSegments(location);
  if (!parts) return { title: "Location not found" };
  const name = [parts.area, parts.city, parts.state].filter(Boolean).join(", ");
  return {
    title: `Schools in ${name}`,
    description: `Explore schools in ${name}. Compare school levels, term fees, curricula and facilities using clearly labelled sample profiles on Skulena.`,
    alternates: { canonical: `/schools/${location.join("/")}` },
  };
}

export default async function LocationSchoolsPage({ params, searchParams }: LocationPageProps) {
  const location = locationFromSegments((await params).location);
  if (!location) notFound();
  const schools = await getPublicSchools();
  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header />
      <SearchResults schools={schools} filters={parseSchoolFilters(await searchParams, location)} />
      <MobileNav />
    </div>
  );
}
