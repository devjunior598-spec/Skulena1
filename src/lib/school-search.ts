import type { School } from "@/data/schools";

export type SearchParams = Record<string, string | string[] | undefined>;
export type SchoolSort = "recommended" | "fees" | "rating" | "class-size" | "name";
export type SchoolFilters = {
  q: string;
  city: string;
  area: string;
  state: string;
  level: string[];
  type: string[];
  curriculum: string[];
  verification: string[];
  facility: string[];
  minFee: string;
  maxFee: string;
  classSize: string;
  transport: boolean;
  special: boolean;
  near: boolean;
  sort: SchoolSort;
  view: "list" | "map";
  page: number;
};

export const searchOptions = {
  level: ["Nursery", "Primary", "Secondary"],
  type: ["Day", "Boarding", "Day & Boarding"],
  curriculum: ["Nigerian", "British", "Montessori", "Cambridge"],
  verification: [
    { value: "physically-verified", label: "Physically verified" },
    { value: "document-verified", label: "Document verified" },
    { value: "school-provided", label: "School provided" },
  ],
  facility: ["Science Laboratory", "ICT Laboratory", "Library", "Sports", "Playground", "Sick Bay", "Security"],
};

const normalize = (value: string) => value.trim().toLocaleLowerCase("en-NG");
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const textValue = (value: string | string[] | undefined) => first(value).trim().slice(0, 160);
const values = (value: string | string[] | undefined) =>
  [...new Set((Array.isArray(value) ? value : [value ?? ""]).flatMap((item) => item.split(",")).map(normalize).filter(Boolean))];
const numberValue = (value: string | string[] | undefined) => {
  const candidate = first(value);
  return /^\d{1,10}$/.test(candidate) ? String(Number(candidate)) : "";
};
const truthy = (value: string | string[] | undefined) => ["1", "true", "yes"].includes(normalize(first(value)));

export function parseSchoolFilters(params: SearchParams, location: Partial<SchoolFilters> = {}): SchoolFilters {
  const sort = first(params.sort);
  return {
    q: textValue(params.q),
    city: textValue(params.city) || location.city || "",
    area: textValue(params.area) || location.area || "",
    state: textValue(params.state) || location.state || "",
    level: values(params.level),
    type: values(params.type),
    curriculum: values(params.curriculum),
    verification: values(params.verification),
    facility: values(params.facility),
    minFee: numberValue(params.minFee),
    maxFee: numberValue(params.maxFee),
    classSize: numberValue(params.classSize),
    transport: truthy(params.transport) || truthy(params.transportation),
    special: truthy(params.special),
    near: truthy(params.near),
    sort: (["fees", "rating", "class-size", "name"].includes(sort) ? sort : "recommended") as SchoolSort,
    view: first(params.view) === "map" ? "map" : "list",
    page: Math.min(100, Math.max(1, Number(numberValue(params.page)) || 1)),
  };
}

export function schoolSearchParams(filters: SchoolFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (typeof value === "boolean") { if (value) params.set(key, "1"); }
    else if (value && !(key === "sort" && value === "recommended") && !(key === "view" && value === "list") && !(key === "page" && value === 1)) params.set(key, String(value));
  }
  return params;
}

export function filterSchools(schools: School[], filters: SchoolFilters): School[] {
  const anyMatch = (selected: string[], offered: string[]) => !selected.length || selected.some((item) => offered.some((offer) => normalize(offer) === item));
  const verificationRank = { "physically-verified": 2, "document-verified": 1, "school-provided": 0 };
  const matches = schools.filter((school) => {
    const searchable = normalize([school.name, school.location, ...school.curriculum, ...school.levels, ...school.tags].join(" "));
    if (filters.q && !normalize(filters.q).split(/\s+/).every((word) => searchable.includes(word))) return false;
    if (filters.city && normalize(school.city) !== normalize(filters.city)) return false;
    if (filters.area && !normalize(school.location).includes(normalize(filters.area))) return false;
    if (filters.state && !school.location.split(",").some((part) => normalize(part) === normalize(filters.state))) return false;
    if (!anyMatch(filters.level, school.levels) || !anyMatch(filters.curriculum, school.curriculum)) return false;
    if (filters.type.length && !filters.type.some((type) => normalize(school.type).includes(type))) return false;
    if (filters.verification.length && !filters.verification.includes(school.verification)) return false;
    if (filters.facility.length && !filters.facility.every((facility) => school.facilities.some((item) => normalize(item) === facility))) return false;
    if (filters.minFee && school.feeTo < Number(filters.minFee)) return false;
    if (filters.maxFee && school.feeFrom > Number(filters.maxFee)) return false;
    if (filters.minFee && filters.maxFee && Number(filters.minFee) > Number(filters.maxFee)) return false;
    if (filters.classSize && school.classSize > Number(filters.classSize)) return false;
    if (filters.transport && !school.facilities.includes("Transportation")) return false;
    if (filters.special && !school.tags.some((tag) => normalize(tag).includes("special needs"))) return false;
    return true;
  });

  return matches.sort((a, b) => {
    if (filters.sort === "fees") return a.feeFrom - b.feeFrom || a.name.localeCompare(b.name);
    if (filters.sort === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount;
    if (filters.sort === "class-size") return a.classSize - b.classSize || a.name.localeCompare(b.name);
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    return verificationRank[b.verification] - verificationRank[a.verification] || b.rating - a.rating;
  });
}

export function locationFromSegments(segments: string[]): Partial<SchoolFilters> | null {
  if (!segments.length || segments.length > 3 || segments.some((part) => part.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(part))) return null;
  const names = segments.map((part) => part.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" "));
  return names.length === 1 ? { city: names[0] } : { state: names[0], city: names[1], area: names[2] || "" };
}
