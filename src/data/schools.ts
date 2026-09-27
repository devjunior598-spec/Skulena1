export type VerificationLevel = "physically-verified" | "document-verified" | "school-provided";

export type SchoolProfileMedia = {
  id: string;
  src: string;
  category: string;
  caption: string;
  alt: string;
  mediaType: "image" | "video";
  verificationStatus?: "pending" | "verified" | "rejected" | "expired";
};

export type PublicVerificationRecord = {
  id: string;
  type: "identity" | "location" | "documents" | "facilities" | "media";
  method: "school_provided" | "document_verified" | "physically_verified";
  subjectType: string;
  subjectId: string | null;
  verifiedAt: string | null;
  publicSummary: string | null;
};

export type SchoolClass = {
  id: string;
  name: string;
  level: string | null;
  acceptingApplications: boolean;
};

export type SchoolFeeDetail = {
  id: string;
  category: string;
  customCategory: string | null;
  academicYear: string;
  updatedAt: string;
  term: string | null;
  amount: number;
  currency: string;
  notes: string | null;
  level: string | null;
  className: string | null;
};

export type PublicSchoolReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
};

export type SchoolFacilityDetail = {
  id: string;
  name: string;
  description: string | null;
  verification: PublicVerificationRecord | null;
};

export type School = {
  databaseId?: string;
  slug: string;
  name: string;
  shortName: string;
  location: string;
  city: string;
  distance: string;
  levels: string[];
  curriculum: string[];
  type: "Day" | "Boarding" | "Day & Boarding" | null;
  schoolType?: "Private" | "Public" | "Faith-based" | "International" | "Other" | null;
  gender?: "Mixed" | "Boys" | "Girls" | null;
  yearEstablished?: number | null;
  branchLatitude?: number | null;
  branchLongitude?: number | null;
  publishedAt?: string | null;
  classes?: SchoolClass[];
  verificationRecords?: PublicVerificationRecord[];
  lastFeeUpdatedAt?: string | null;
  admissionStatus?: "open" | "closed" | "opening_soon";
  admissionsAvailable?: boolean;
  admissionDescription?: string;
  admissionRequirements?: string[];
  publicEmail?: string | null;
  publicPhone?: string | null;
  websiteUrl?: string | null;
  addressLine?: string | null;
  feeDetails?: SchoolFeeDetail[];
  facilityDetails?: SchoolFacilityDetail[];
  publicReviews?: PublicSchoolReview[];
  feeFrom: number;
  feeTo: number;
  feePublished?: boolean;
  rating: number;
  reviewCount: number;
  classSize: number;
  verification: VerificationLevel;
  image: string | null;
  imageAlt?: string;
  hasApprovedCover?: boolean;
  logo: string | null;
  images: string[];
  media?: SchoolProfileMedia[];
  description: string;
  facilities: string[];
  tags: string[];
};

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}
