import { getSchoolVerificationLevel } from "@/data/verification";

export type VerificationLevel = "physically-verified" | "document-verified" | "school-provided";

export type School = {
  databaseId?: string;
  isDemo: boolean;
  slug: string;
  name: string;
  shortName: string;
  location: string;
  city: string;
  distance: string;
  levels: string[];
  curriculum: string[];
  type: "Day" | "Day & Boarding";
  admissionStatus?: "open" | "closed" | "opening_soon";
  admissionDescription?: string;
  feeFrom: number;
  feeTo: number;
  rating: number;
  reviewCount: number;
  classSize: number;
  verification: VerificationLevel;
  image: string;
  images: string[];
  description: string;
  facilities: string[];
  tags: string[];
};

const schoolFixtures: School[] = [
  {
    isDemo: true,
    slug: "greenfield-international-school",
    name: "Greenfield International School",
    shortName: "Greenfield",
    location: "Alakia, Ibadan, Oyo",
    city: "Ibadan",
    distance: "3.2 km away",
    levels: ["Nursery", "Primary", "Secondary"],
    curriculum: ["British", "Nigerian"],
    type: "Day & Boarding",
    admissionStatus: "opening_soon",
    feeFrom: 420000,
    feeTo: 1250000,
    rating: 4.8,
    reviewCount: 48,
    classSize: 18,
    verification: "physically-verified",
    image: "/images/demo/campus.jpg",
    images: [
      "/images/demo/campus.jpg",
      "/images/demo/classroom.jpg",
      "/images/demo/laboratory.jpg",
      "/images/demo/library.jpg",
    ],
    description: "A warm, future-focused school combining strong academics with confident communication, creativity and character. Greenfield serves families from nursery through secondary school in a calm, well-equipped campus.",
    facilities: ["Science Laboratory", "ICT Laboratory", "Library", "Sports", "Playground", "Transportation", "Sick Bay", "Boarding", "Security"],
    tags: ["Small classes", "School bus", "Special needs support"],
  },
  {
    isDemo: true,
    slug: "the-oakbridge-academy",
    name: "The Oakbridge Academy",
    shortName: "Oakbridge",
    location: "Bodija, Ibadan, Oyo",
    city: "Ibadan",
    distance: "5.7 km away",
    levels: ["Nursery", "Primary"],
    curriculum: ["Montessori", "Nigerian"],
    type: "Day",
    admissionStatus: "open",
    feeFrom: 280000,
    feeTo: 610000,
    rating: 4.7,
    reviewCount: 31,
    classSize: 16,
    verification: "document-verified",
    image: "/images/demo/primary.jpg",
    images: [],
    description: "A joyful early-years and primary community built around curiosity and individual attention.",
    facilities: ["Library", "ICT Laboratory", "Playground", "Transportation", "Sick Bay"],
    tags: ["Montessori", "After-school care"],
  },
  {
    isDemo: true,
    slug: "horizon-college-ibadan",
    name: "Horizon College, Ibadan",
    shortName: "Horizon College",
    location: "Oluyole, Ibadan, Oyo",
    city: "Ibadan",
    distance: "8.4 km away",
    levels: ["Secondary"],
    curriculum: ["Nigerian", "Cambridge"],
    type: "Day & Boarding",
    admissionStatus: "closed",
    feeFrom: 650000,
    feeTo: 1480000,
    rating: 4.6,
    reviewCount: 27,
    classSize: 22,
    verification: "physically-verified",
    image: "/images/demo/secondary.jpg",
    images: [],
    description: "A secondary school focused on academic rigour, leadership and preparation for university.",
    facilities: ["Science Laboratory", "ICT Laboratory", "Library", "Sports", "Boarding", "Security"],
    tags: ["Cambridge", "Boarding"],
  },
  {
    isDemo: true,
    slug: "sunrise-heritage-school",
    name: "Sunrise Heritage School",
    shortName: "Sunrise Heritage",
    location: "Akobo, Ibadan, Oyo",
    city: "Ibadan",
    distance: "10.1 km away",
    levels: ["Nursery", "Primary", "Secondary"],
    curriculum: ["Nigerian"],
    type: "Day",
    admissionStatus: "open",
    feeFrom: 190000,
    feeTo: 480000,
    rating: 4.5,
    reviewCount: 19,
    classSize: 20,
    verification: "school-provided",
    image: "/images/demo/library.jpg",
    images: [],
    description: "A community-centred school with an accessible, well-rounded learning programme.",
    facilities: ["Library", "Playground", "Transportation", "Security"],
    tags: ["Affordable", "School bus"],
  },
];

// Visible verification is always derived from a matching evidence record.
export const schools: School[] = schoolFixtures.map((school) => ({ ...school, verification: getSchoolVerificationLevel(school.slug) }));
export const featuredSchools = schools.slice(0, 3);

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getSchool(slug: string) {
  return schools.find((school) => school.slug === slug);
}
