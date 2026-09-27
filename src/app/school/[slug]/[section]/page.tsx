import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolProfileContent } from "@/components/schools/school-profile-content";
import { schoolProfileSections, SchoolProfileShell } from "@/components/schools/school-profile-shell";
import { getSchoolProfile } from "@/data/profile";
import { getPublicSchoolBySlug } from "@/lib/schools/public-schools";
import { getCurrentAccount, roleHome } from "@/lib/auth";

type PageProps = { params: Promise<{ slug: string; section: string }> };

const descriptions: Record<string, string> = {
  facilities: "Explore facilities and support listed by the school.",
  fees: "Review the school’s published fees and the details families should confirm.",
  admissions: "Check the school’s admissions information and published contact options.",
  photos: "View school photos and videos approved for public display.",
  reviews: "Read published reviews from families.",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, section: sectionParam } = await params;
  const section = schoolProfileSections.find((item) => item.id === sectionParam);
  if (!section || section.id === "overview") return {};
  const school = await getPublicSchoolBySlug(slug);
  if (!school) return {};
  return { title: `${section.label} | ${school.name}`, description: descriptions[section.id] };
}

export default async function SchoolProfileSectionPage({ params }: PageProps) {
  const { slug, section: sectionParam } = await params;
  const section = schoolProfileSections.find((item) => item.id === sectionParam);
  if (!section || section.id === "overview") notFound();

  const [school, account] = await Promise.all([getPublicSchoolBySlug(slug), getCurrentAccount()]);
  if (!school) notFound();
  const profile = getSchoolProfile(school);
  const accountHref = account?.profile ? roleHome(account.profile.role) : null;

  return <SchoolProfileShell school={school} section={section.id} accountHref={accountHref}>
    <SchoolProfileContent section={section.id} school={school} profile={profile} />
  </SchoolProfileShell>;
}
