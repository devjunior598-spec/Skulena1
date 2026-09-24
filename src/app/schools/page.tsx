import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { MobileNav } from "@/components/site/mobile-nav";
import { SearchResults } from "@/components/schools/search-results";
import { getPublicSchools } from "@/lib/schools/public-schools";
import { parseSchoolFilters, type SearchParams } from "@/lib/school-search";

export const metadata: Metadata = {
  title: "Find Schools",
  description: "Find schools by location, level, term fees, curriculum and facilities. Explore clearly labelled sample school profiles on Skulena.",
};

export default async function SchoolsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseSchoolFilters(await searchParams);
  const schools = await getPublicSchools();
  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header />
      <SearchResults schools={schools} filters={filters} />
      <MobileNav />
    </div>
  );
}
