import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { HOME_SCHOOL_LIMIT, HomepageContent } from "@/components/site/homepage-content";
import { getCurrentAccount, roleHome } from "@/lib/auth";
import { getParentSavedSchoolIds, getPublicSchools, getPublicSchoolPayStatus } from "@/lib/schools/public-schools";

export const metadata: Metadata = {
  title: "Find the right school for your child",
  description: "Explore published Nigerian school profiles, compare the fees and facilities schools share, and apply when admissions are open.",
  openGraph: {
    title: "Find the right school for your child | Skulena",
    description: "Explore published Nigerian school profiles, compare school information, and apply when a school is accepting students.",
  },
};

export default async function Home() {
  const [schools, account, schoolPay] = await Promise.all([
    getPublicSchools({ limit: HOME_SCHOOL_LIMIT }),
    getCurrentAccount(),
    getPublicSchoolPayStatus(),
  ]);
  const showSave = !account?.user || account.profile?.role === "parent";
  const savedSchoolIds = account?.profile?.role === "parent"
    ? await getParentSavedSchoolIds(account.user.id, schools.map((school) => school.databaseId).filter((id): id is string => Boolean(id)))
    : [];
  const accountHref = account?.profile ? roleHome(account.profile.role) : null;

  return <div className="min-h-screen bg-[#fafbf9]"><Header accountHref={accountHref} /><HomepageContent schools={schools} schoolPay={schoolPay} savedSchoolIds={savedSchoolIds} showSave={showSave} /><Footer /></div>;
}
