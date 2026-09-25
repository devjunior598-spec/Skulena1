export type VerificationLevel = "physically-verified" | "document-verified" | "school-provided";

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
  type: "Day" | "Day & Boarding";
  admissionStatus?: "open" | "closed" | "opening_soon";
  admissionDescription?: string;
  feeFrom: number;
  feeTo: number;
  rating: number;
  reviewCount: number;
  classSize: number;
  verification: VerificationLevel;
  image: string | null;
  images: string[];
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
