import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { SearchResults } from "@/components/schools/search-results";
import { getCurrentAccount, roleHome } from "@/lib/auth";
import { getParentSavedSchoolIds, getPublicSchools } from "@/lib/schools/public-schools";
import { parseSchoolFilters, type SearchParams } from "@/lib/school-search";

export const metadata: Metadata = {
  title: "Find Schools",
  description: "Find schools by location, level, term fees, curriculum and facilities. Compare published school profiles on Skulena.",
};

export default async function SchoolsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseSchoolFilters(await searchParams);
  const [schools, account] = await Promise.all([getPublicSchools(), getCurrentAccount()]);
  const showSave = !account?.user || account.profile?.role === "parent";
  const savedSchoolIds = account?.profile?.role === "parent"
    ? await getParentSavedSchoolIds(account.user.id, schools.map((school) => school.databaseId).filter((id): id is string => Boolean(id)))
    : [];
  const accountHref = account?.profile ? roleHome(account.profile.role) : null;
  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header accountHref={accountHref} />
      <SearchResults schools={schools} filters={filters} savedSchoolIds={savedSchoolIds} showSave={showSave} />
    </div>
  );
}
