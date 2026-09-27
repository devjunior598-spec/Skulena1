import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { SearchResults } from "@/components/schools/search-results";
import { getCurrentAccount, roleHome } from "@/lib/auth";
import { getParentSavedSchoolIds, getPublicSchools } from "@/lib/schools/public-schools";
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
    description: `Explore schools in ${name}. Compare school levels, term fees, curricula and facilities from published profiles on Skulena.`,
    alternates: { canonical: `/schools/${location.join("/")}` },
  };
}

export default async function LocationSchoolsPage({ params, searchParams }: LocationPageProps) {
  const location = locationFromSegments((await params).location);
  if (!location) notFound();
  const [schools, account] = await Promise.all([getPublicSchools(), getCurrentAccount()]);
  const showSave = !account?.user || account.profile?.role === "parent";
  const savedSchoolIds = account?.profile?.role === "parent"
    ? await getParentSavedSchoolIds(account.user.id, schools.map((school) => school.databaseId).filter((id): id is string => Boolean(id)))
    : [];
  const accountHref = account?.profile ? roleHome(account.profile.role) : null;
  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header accountHref={accountHref} />
      <SearchResults schools={schools} filters={parseSchoolFilters(await searchParams, location)} savedSchoolIds={savedSchoolIds} showSave={showSave} />
    </div>
  );
}
