import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { School, VerificationLevel } from "@/data/schools";
import { SCHOOL_LOGO_CATEGORY } from "@/types/domain";

function relationName(value: unknown) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return relationName(value[0]);
  return "name" in value && typeof value.name === "string" ? value.name : null;
}

function displayAddressPart(value: string) {
  return value.split(/(\s+)/).map((word) => {
    if (!word.trim()) return word;
    const letters = word.replace(/[^a-z]/gi, "");
    if (letters.length <= 3 && letters === letters.toUpperCase() && letters.length > 1) return word.toUpperCase();
    return word.charAt(0).toLocaleUpperCase("en-NG") + word.slice(1).toLocaleLowerCase("en-NG");
  }).join("").replace(/\bFct\b/gi, "FCT");
}

function addressParts(...values: Array<string | null | undefined>) {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    for (const candidate of (value ?? "").split(",")) {
      const part = candidate.trim();
      const key = part.toLocaleLowerCase("en-NG");
      if (part && !seen.has(key)) {
        seen.add(key);
        parts.push(displayAddressPart(part));
      }
    }
  }
  return parts;
}

function structureLabel(value: string | null | undefined): NonNullable<School["type"]> | null {
  if (value === "day_and_boarding") return "Day & Boarding";
  if (value === "boarding") return "Boarding";
  if (value === "day") return "Day";
  return null;
}

function schoolTypeLabel(value: string | null | undefined): School["schoolType"] {
  const labels: Record<string, NonNullable<School["schoolType"]>> = {
    private: "Private",
    public: "Public",
    faith_based: "Faith-based",
    international: "International",
    other: "Other",
  };
  return value ? labels[value] ?? null : null;
}

function genderLabel(value: string | null | undefined): School["gender"] {
  const labels: Record<string, NonNullable<School["gender"]>> = { mixed: "Mixed", boys: "Boys", girls: "Girls" };
  return value ? labels[value] ?? null : null;
}

type PublicSchoolQueryOptions = { limit?: number; ids?: string[] };

function groupBySchoolId<T extends { school_id: string }>(rows: T[] | null | undefined) {
  const grouped = new Map<string, T[]>();
  for (const row of rows ?? []) {
    const group = grouped.get(row.school_id);
    if (group) group.push(row);
    else grouped.set(row.school_id, [row]);
  }
  return grouped;
}

export async function getPublicSchools(options: PublicSchoolQueryOptions = {}): Promise<School[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  if (options.ids && options.ids.length === 0) return [];

  const pageSize = 250;
  const rows = [];
  let listQuery = supabase.from("public_school_profiles").select("id, slug, name, short_name, school_type, year_established, description, public_email, public_phone, website_url, structure, gender, admission_status, admission_description, published_at").order("published_at", { ascending: false });
  if (options.ids) listQuery = listQuery.in("id", options.ids).limit(options.ids.length);
  else if (options.limit) listQuery = listQuery.limit(Math.min(12, Math.max(1, Math.floor(options.limit))));
  else listQuery = listQuery.range(0, pageSize - 1);

  const { data: firstPage, error: firstPageError } = await listQuery;
  if (firstPageError) return [];
  rows.push(...(firstPage ?? []));
  if (!options.ids && !options.limit && firstPage?.length === pageSize) {
    for (let from = pageSize; ; from += pageSize) {
      const { data, error } = await supabase.from("public_school_profiles").select("id, slug, name, short_name, school_type, year_established, description, public_email, public_phone, website_url, structure, gender, admission_status, admission_description, published_at").order("published_at", { ascending: false }).range(from, from + pageSize - 1);
      if (error) return [];
      rows.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }
  }
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [{ data: branches }, { data: levels }, { data: curricula }, { data: facilities }, { data: fees }, { data: verification }, { data: media }] = await Promise.all([
    supabase.from("school_branches").select("school_id, state, city, area, is_main").in("school_id", ids),
    supabase.from("school_levels").select("school_id, levels(name, sort_order)").in("school_id", ids),
    supabase.from("school_curricula").select("school_id, custom_name, curricula(name)").in("school_id", ids),
    supabase.from("school_facilities").select("school_id, facilities(name)").in("school_id", ids),
    supabase.from("school_fees").select("school_id, amount, category").in("school_id", ids),
    supabase.from("public_verification_records").select("school_id, method").in("school_id", ids),
    supabase.from("school_media").select("id, school_id, category, media_type, storage_path, alt_text, is_cover, sort_order, created_at").in("school_id", ids).eq("media_type", "image").eq("moderation_status", "approved").order("sort_order").order("created_at", { ascending: false }),
  ]);

  const branchesBySchool = groupBySchoolId(branches);
  const levelsBySchool = groupBySchoolId(levels);
  const curriculaBySchool = groupBySchoolId(curricula);
  const facilitiesBySchool = groupBySchoolId(facilities);
  const feesBySchool = groupBySchoolId(fees);
  const verificationBySchool = groupBySchoolId(verification);
  const mediaBySchool = groupBySchoolId(media);
  const coverAndLogoBySchool = new Map<string, { cover: (typeof media extends (infer T)[] | null ? T : never) | null; logo: (typeof media extends (infer T)[] | null ? T : never) | null }>();
  const signablePaths = new Set<string>();

  for (const row of rows) {
    const schoolMedia = mediaBySchool.get(row.id) ?? [];
    const logo = schoolMedia.find((item) => item.category.toLowerCase() === SCHOOL_LOGO_CATEGORY.toLowerCase()) ?? null;
    const galleryMedia = schoolMedia.filter((item) => item.category.toLowerCase() !== SCHOOL_LOGO_CATEGORY.toLowerCase());
    const cover = galleryMedia.find((item) => item.is_cover) ?? galleryMedia[0] ?? null;
    coverAndLogoBySchool.set(row.id, { cover, logo });
    if (cover) signablePaths.add(cover.storage_path);
    if (logo) signablePaths.add(logo.storage_path);
  }

  const paths = [...signablePaths];
  const signed = paths.length ? await supabase.storage.from("school-media").createSignedUrls(paths, 3600) : { data: [] };
  const urls = new Map((signed.data ?? []).map((item) => [item.path, item.signedUrl]));
  return rows.map((row) => {
    const branchRows = branchesBySchool.get(row.id) ?? [];
    const branch = branchRows.find((item) => item.is_main) ?? branchRows[0];
    const tuitionAmounts = (feesBySchool.get(row.id) ?? []).filter((item) => item.category === "tuition").map((item) => Number(item.amount)).filter((amount) => Number.isFinite(amount) && amount >= 0);
    const methods = (verificationBySchool.get(row.id) ?? []).map((item) => item.method);
    const verificationLevel: VerificationLevel = methods.includes("physically_verified") ? "physically-verified" : methods.includes("document_verified") ? "document-verified" : "school-provided";
    const schoolLevels = [...(levelsBySchool.get(row.id) ?? [])].sort((a, b) => {
      const levelA = Array.isArray(a.levels) ? a.levels[0] : a.levels;
      const levelB = Array.isArray(b.levels) ? b.levels[0] : b.levels;
      return (levelA?.sort_order ?? Number.MAX_SAFE_INTEGER) - (levelB?.sort_order ?? Number.MAX_SAFE_INTEGER);
    });
    const media = coverAndLogoBySchool.get(row.id);
    const coverUrl = media?.cover ? urls.get(media.cover.storage_path) ?? null : null;
    const logoUrl = media?.logo ? urls.get(media.logo.storage_path) ?? null : null;
    return {
      databaseId: row.id,
      slug: row.slug,
      name: row.name,
      shortName: row.short_name || row.name,
      location: addressParts(branch?.area, branch?.city, branch?.state).join(", "),
      city: branch?.city ? displayAddressPart(branch.city) : "",
      distance: "",
      levels: schoolLevels.map((item) => relationName(item.levels)).filter((value): value is string => Boolean(value)),
      curriculum: (curriculaBySchool.get(row.id) ?? []).map((item) => item.custom_name || relationName(item.curricula)).filter((value): value is string => Boolean(value)),
      type: structureLabel(row.structure),
      schoolType: schoolTypeLabel(row.school_type),
      gender: genderLabel(row.gender),
      yearEstablished: row.year_established,
      admissionStatus: row.admission_status,
      admissionDescription: row.admission_description || undefined,
      feeFrom: tuitionAmounts.length ? Math.min(...tuitionAmounts) : 0,
      feeTo: tuitionAmounts.length ? Math.max(...tuitionAmounts) : 0,
      feePublished: tuitionAmounts.length > 0,
      rating: 0,
      reviewCount: 0,
      classSize: 0,
      verification: verificationLevel,
      image: coverUrl,
      imageAlt: media?.cover?.alt_text?.trim() || `${row.name} campus photo`,
      hasApprovedCover: Boolean(media?.cover),
      logo: logoUrl,
      images: [],
      media: [],
      description: row.description || "",
      facilities: (facilitiesBySchool.get(row.id) ?? []).map((item) => relationName(item.facilities)).filter((value): value is string => Boolean(value)),
      tags: [],
    } satisfies School;
  });
}

export async function getParentSavedSchoolIds(parentId: string, schoolIds: string[]) {
  if (schoolIds.length === 0) return [];
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("saved_schools").select("school_id").eq("parent_id", parentId).in("school_id", schoolIds);
  if (error) return [];
  return (data ?? []).map((row) => row.school_id);
}

export async function getPublicSchoolPayStatus() {
  const unavailable = { publicVisible: false, schoolEnrollmentEnabled: false, parentApplicationsEnabled: false, financialExecutionEnabled: false, available: false };
  const supabase = await createClient();
  if (!supabase) return unavailable;
  const { data, error } = await supabase.from("platform_features").select("feature_key, enabled").in("feature_key", [
    "schoolpay_public_visible",
    "schoolpay_school_enrollment_enabled",
    "schoolpay_parent_applications_enabled",
    "schoolpay_financial_execution_enabled",
  ]);
  if (error || !data) return unavailable;
  const flags = new Map(data.map((row) => [row.feature_key, row.enabled === true]));
  const publicVisible = flags.get("schoolpay_public_visible") === true;
  const schoolEnrollmentEnabled = flags.get("schoolpay_school_enrollment_enabled") === true;
  const parentApplicationsEnabled = flags.get("schoolpay_parent_applications_enabled") === true;
  const financialExecutionEnabled = flags.get("schoolpay_financial_execution_enabled") === true;
  return { publicVisible, schoolEnrollmentEnabled, parentApplicationsEnabled, financialExecutionEnabled, available: publicVisible && schoolEnrollmentEnabled && parentApplicationsEnabled && financialExecutionEnabled };
}

export const getPublicSchoolBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  if (!supabase) return undefined;

  const { data: row, error } = await supabase.from("public_school_profiles").select("*").eq("slug", slug).maybeSingle();
  if (error || !row) return undefined;

  const schoolId = row.id;
  const [branchesResult, levelsResult, curriculaResult, facilitiesResult, feesResult, verificationResult, mediaResult, requirementsResult, reviewsResult, classesResult, admissionSettingsResult, admissionsFeatureResult] = await Promise.all([
    supabase.from("school_branches").select("id, school_id, state, city, area, address_line, country, latitude, longitude, is_main").eq("school_id", schoolId),
    supabase.from("school_levels").select("school_id, levels(name, sort_order)").eq("school_id", schoolId),
    supabase.from("school_curricula").select("school_id, custom_name, curricula(name)").eq("school_id", schoolId),
    supabase.from("school_facilities").select("id, school_id, custom_name, description, facilities(name)").eq("school_id", schoolId),
    supabase.from("school_fees").select("id, school_id, category, custom_category, term, academic_year, amount, currency, notes, updated_at, levels(name), school_classes(name)").eq("school_id", schoolId).order("academic_year", { ascending: false }).order("term"),
    supabase.from("public_verification_records").select("id, school_id, branch_id, verification_type, method, subject_type, subject_id, verified_at, public_summary").eq("school_id", schoolId),
    supabase.from("school_media").select("id, school_id, category, media_type, storage_path, caption, alt_text, is_cover, sort_order, verification_status").eq("school_id", schoolId).eq("moderation_status", "approved").order("sort_order").order("created_at", { ascending: false }),
    supabase.from("school_admission_requirements").select("school_id, requirement, sort_order").eq("school_id", schoolId).order("sort_order"),
    supabase.from("public_reviews").select("id, school_id, rating, title, body, created_at").eq("school_id", schoolId).order("created_at", { ascending: false }),
    supabase.from("school_classes").select("id, school_id, name, accepting_applications, levels(name)").eq("school_id", schoolId).order("name"),
    supabase.from("school_admission_settings").select("applications_enabled, opens_at, closes_at").eq("school_id", schoolId).maybeSingle(),
    supabase.from("platform_features").select("enabled").eq("feature_key", "admissions_enabled").maybeSingle(),
  ]);

  const branches = branchesResult.data ?? [];
  const branch = branches.find((item) => item.is_main) ?? branches[0];
  const fees = feesResult.data ?? [];
  const tuitionAmounts = fees.filter((item) => item.category === "tuition").map((item) => Number(item.amount)).filter(Number.isFinite);
  const schoolMedia = mediaResult.data ?? [];
  const logoMedia = schoolMedia.find((item) => item.category.toLowerCase() === SCHOOL_LOGO_CATEGORY.toLowerCase() && item.media_type === "image");
  const unprioritizedGalleryMedia = schoolMedia.filter((item) => item.category.toLowerCase() !== SCHOOL_LOGO_CATEGORY.toLowerCase());
  const coverMedia = unprioritizedGalleryMedia.find((item) => item.media_type === "image" && item.is_cover) ?? unprioritizedGalleryMedia.find((item) => item.media_type === "image");
  const galleryMedia = coverMedia ? [coverMedia, ...unprioritizedGalleryMedia.filter((item) => item.id !== coverMedia.id)] : unprioritizedGalleryMedia;
  const paths = schoolMedia.map((item) => item.storage_path);
  const signed = paths.length ? await supabase.storage.from("school-media").createSignedUrls(paths, 3600) : { data: [] };
  const urls = new Map((signed.data ?? []).map((item) => [item.path, item.signedUrl]));
  const profileMedia = galleryMedia.flatMap((item) => {
    const src = urls.get(item.storage_path);
    return src ? [{ id: item.id, src, category: item.category, caption: item.caption || "", alt: item.alt_text || `${row.name} ${item.category.toLowerCase()}`, mediaType: item.media_type, verificationStatus: item.verification_status }] : [];
  });
  const verificationRecords = (verificationResult.data ?? []).map((item) => ({
    id: item.id,
    type: item.verification_type,
    method: item.method,
    subjectType: item.subject_type,
    subjectId: item.subject_id,
    verifiedAt: item.verified_at,
    publicSummary: item.public_summary,
  }));
  const methods = verificationRecords.map((item) => item.method);
  const verification: VerificationLevel = methods.includes("physically_verified") ? "physically-verified" : methods.includes("document_verified") ? "document-verified" : "school-provided";
  const reviews = (reviewsResult.data ?? []).map((item) => ({ id: item.id, rating: Number(item.rating), title: item.title, body: item.body, createdAt: item.created_at }));
  const formattedAddress = addressParts(branch?.address_line, branch?.area, branch?.city, branch?.state, branch?.country);
  const levelRows = (levelsResult.data ?? []).filter((item) => item.school_id === schoolId).sort((a, b) => {
    const levelA = Array.isArray(a.levels) ? a.levels[0] : a.levels;
    const levelB = Array.isArray(b.levels) ? b.levels[0] : b.levels;
    return (levelA?.sort_order ?? Number.MAX_SAFE_INTEGER) - (levelB?.sort_order ?? Number.MAX_SAFE_INTEGER);
  });
  const facilityRows = facilitiesResult.data ?? [];
  const classes = classesResult.data ?? [];
  const admissionsSettings = admissionSettingsResult.data;
  const currentTime = Date.now();
  const admissionsAvailable = Boolean(admissionsFeatureResult.data?.enabled && row.admission_status === "open"
    && admissionsSettings?.applications_enabled && classes.some((item) => item.accepting_applications)
    && (!admissionsSettings.opens_at || new Date(admissionsSettings.opens_at).getTime() <= currentTime)
    && (!admissionsSettings.closes_at || new Date(admissionsSettings.closes_at).getTime() >= currentTime));

  return {
    databaseId: schoolId,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name || row.name,
    location: addressParts(branch?.area, branch?.city, branch?.state).join(", ") || "",
    city: branch?.city ? displayAddressPart(branch.city) : "",
    addressLine: formattedAddress.join(", ") || null,
    branchLatitude: branch?.latitude == null ? null : Number(branch.latitude),
    branchLongitude: branch?.longitude == null ? null : Number(branch.longitude),
    publishedAt: row.published_at,
    distance: "",
    levels: levelRows.map((item) => relationName(item.levels)).filter((value): value is string => Boolean(value)),
    curriculum: (curriculaResult.data ?? []).map((item) => item.custom_name || relationName(item.curricula)).filter((value): value is string => Boolean(value)),
    type: structureLabel(row.structure),
    schoolType: schoolTypeLabel(row.school_type),
    gender: genderLabel(row.gender),
    yearEstablished: row.year_established,
    verificationRecords,
    classes: classes.map((item) => ({ id: item.id, name: item.name, level: relationName(item.levels), acceptingApplications: item.accepting_applications })),
    admissionStatus: row.admission_status,
    admissionsAvailable,
    admissionDescription: row.admission_description || undefined,
    admissionRequirements: (requirementsResult.data ?? []).map((item) => item.requirement),
    publicEmail: row.public_email || null,
    publicPhone: row.public_phone || null,
    websiteUrl: row.website_url || null,
    feeFrom: tuitionAmounts.length ? Math.min(...tuitionAmounts) : 0,
    feeTo: tuitionAmounts.length ? Math.max(...tuitionAmounts) : 0,
    feeDetails: fees.map((item) => ({
      id: item.id,
      category: item.category,
      customCategory: item.custom_category,
      academicYear: item.academic_year,
      updatedAt: item.updated_at,
      term: item.term,
      amount: Number(item.amount),
      currency: String(item.currency || "NGN").trim(),
      notes: item.notes,
      level: relationName(item.levels),
      className: relationName(item.school_classes),
    })),
    rating: reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0,
    reviewCount: reviews.length,
    publicReviews: reviews,
    lastFeeUpdatedAt: fees.reduce<string | null>((latest, fee) => !latest || fee.updated_at > latest ? fee.updated_at : latest, null),
    classSize: 0,
    verification,
    image: coverMedia ? urls.get(coverMedia.storage_path) ?? null : null,
    logo: logoMedia ? urls.get(logoMedia.storage_path) ?? null : null,
    images: profileMedia.filter((item) => item.mediaType === "image").map((item) => item.src),
    media: profileMedia,
    description: row.description || "",
    facilities: facilityRows.map((item) => item.custom_name || relationName(item.facilities)).filter((value): value is string => Boolean(value)),
    facilityDetails: facilityRows.map((item) => ({
      id: item.id,
      name: item.custom_name || relationName(item.facilities) || "School facility",
      description: item.description,
      verification: verificationRecords.find((record) => record.type === "facilities" && record.subjectId === item.id) ?? null,
    })),
    tags: [],
  } satisfies School;
});
