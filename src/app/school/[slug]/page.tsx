import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolProfileContent } from "@/components/schools/school-profile-content";
import { SchoolProfileShell } from "@/components/schools/school-profile-shell";
import { getSchoolProfile } from "@/data/profile";
import { getPublicSchoolBySlug } from "@/lib/schools/public-schools";
import { getCurrentAccount, roleHome } from "@/lib/auth";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const school = await getPublicSchoolBySlug((await params).slug);
  if (!school) return {};
  const location = school.location ? `, ${school.location}` : "";
  const description = school.description.trim() || `Explore the published school information${location}. Contact the school directly for details.`;
  return { title: `${school.name}${location}`, description, alternates: { canonical: `/school/${encodeURIComponent(school.slug)}` } };
}

export default async function SchoolProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [school, account] = await Promise.all([getPublicSchoolBySlug(slug), getCurrentAccount()]);
  if (!school) notFound();
  const profile = getSchoolProfile(school);
  const accountHref = account?.profile ? roleHome(account.profile.role) : null;

  return <SchoolProfileShell school={school} section="overview" accountHref={accountHref}>
    <SchoolProfileContent section="overview" school={school} profile={profile} />
  </SchoolProfileShell>;
}
