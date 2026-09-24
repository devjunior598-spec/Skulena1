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

const greenfieldProfile: SchoolProfileDetails = {
  story: "This fictional profile illustrates how families could explore a school in one place. In this example, a blended British and Nigerian curriculum combines literacy, numeracy and science with creative projects. The sample school offers day and boarding options, with nursery, primary and secondary levels. Ask about class sizes, learning support and daily routines when assessing any real school.",
  fees: {
    session: "2026/2027",
    verificationKey: "2026-2027",
    rows: [
      { level: "Nursery", from: 420000, to: 540000 },
      { level: "Primary", from: 600000, to: 850000 },
      { level: "Secondary", from: 900000, to: 1250000 },
    ],
    excludes: ["Uniforms", "Meals", "Transportation", "Boarding", "Optional activities"],
  },
  admissions: {
    status: "Example admissions process — live availability has not been confirmed.",
    steps: ["Enquire about a place", "Arrange an assessment", "Review the admission decision"],
    requirements: ["Discuss the appropriate year group with the admissions team.", "Confirm the school's current requirements and complete fee schedule.", "Share any child records only through an authorised, secure admissions service."],
  },
  reviews: [{
    id: "demo-review-greenfield-1",
    author: "Sample parent review",
    context: "Fictional example · no parent identity verified",
    rating: 5,
    text: "The teachers communicate well and our child has settled in confidently. We especially value the reading programme and the small class size.",
  }],
  media: [
    { id: "greenfield-campus", src: "/images/demo/campus.jpg", category: "Campus", caption: "Campus inspiration · illustrative stock photo", alt: "Illustrative stock photo of an education campus; not Greenfield School" },
    { id: "greenfield-classroom", src: "/images/demo/classroom.jpg", category: "Classrooms", caption: "Learning environment · illustrative stock photo", alt: "Illustrative stock photo of a classroom; not Greenfield School" },
    { id: "greenfield-lab", src: "/images/demo/laboratory.jpg", category: "Science Laboratory", caption: "Science laboratory inspiration · illustrative stock photo", alt: "Illustrative stock photo of laboratory equipment; not Greenfield School" },
    { id: "greenfield-library", src: "/images/demo/library.jpg", category: "Library", caption: "Library inspiration · illustrative stock photo", alt: "Illustrative stock photo of a library; not Greenfield School" },
  ],
};

const profiles: Record<string, SchoolProfileDetails> = { "greenfield-international-school": greenfieldProfile };

export function getSchoolProfile(school: School): SchoolProfileDetails {
  return profiles[school.slug] ?? {
    story: school.isDemo ? "This is a fictional sample listing for exploring school discovery. Detailed fees, admissions requirements and facility evidence have not been added to this demo profile." : school.description,
    fees: { session: "Not specified", verificationKey: "not-provided", rows: [], excludes: [] },
    admissions: { status: school.isDemo ? "Admissions availability and requirements have not been provided." : `${school.admissionStatus === "open" ? "Admissions are open." : school.admissionStatus === "opening_soon" ? "Admissions are opening soon." : "Admissions are currently closed."}${school.admissionDescription ? ` ${school.admissionDescription}` : ""}`, steps: [], requirements: [] },
    reviews: [],
    media: school.images.length ? school.images.map((src, index) => ({ id: `${school.slug}-media-${index}`, src, category: "Campus" as const, caption: school.isDemo ? "Illustrative stock photo" : "School media", alt: school.isDemo ? `Illustrative stock photo for the fictional ${school.name} profile` : `${school.name} campus media` })) : [{ id: `${school.slug}-campus`, src: school.image, category: "Campus", caption: school.isDemo ? "Illustrative stock photo · not this school's campus" : "School media", alt: school.isDemo ? `Illustrative stock photo for the fictional ${school.name} profile` : `${school.name} campus media` }],
  };
}
