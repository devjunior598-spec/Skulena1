import type { School } from "@/data/schools";
import { mediaCategories } from "@/types/domain";

export { mediaCategories };

export type ProfileMedia = {
  id: string;
  src: string;
  category: (typeof mediaCategories)[number];
  caption: string;
  alt: string;
};

export type SchoolProfileDetails = {
  story: string;
  fees: { session: string; verificationKey: string; rows: { level: string; from: number; to: number }[]; excludes: string[] };
  admissions: { status: string; steps: string[]; requirements: string[] };
  reviews: { id: string; author: string; context: string; rating: number; text: string }[];
  media: ProfileMedia[];
};

export function getSchoolProfile(school: School): SchoolProfileDetails {
  return {
    story: school.description,
    fees: { session: "Not specified", verificationKey: "not-provided", rows: [], excludes: [] },
    admissions: {
      status: school.admissionDescription || "Contact the school to confirm current admissions information.",
      steps: [],
      requirements: [],
    },
    reviews: [],
    media: school.images.map((src, index) => ({
      id: `${school.slug}-media-${index}`,
      src,
      category: "Campus",
      caption: "School media",
      alt: `${school.name} campus media`,
    })),
  };
}
