import "server-only";

import { SCHOOL_LOGO_CATEGORY } from "@/types/domain";

function relation<T>(value: T | T[] | null | undefined): T | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export async function getSchoolWorkspaceData(supabase: NonNullable<Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>>, schoolId: string) {
  const [branchResult, levelsResult, curriculaResult, facilitiesResult, feesResult, requirementsResult, mediaResult, documentsResult, verificationResult, classesResult, teamResult, reviewsResult, responsesResult, completionResult] = await Promise.all([
    supabase.from("school_branches").select("id, name, country, state, city, area, address_line, is_main").eq("school_id", schoolId).order("is_main", { ascending: false }),
    supabase.from("school_levels").select("level_id, levels(name, code, sort_order)").eq("school_id", schoolId),
    supabase.from("school_curricula").select("curriculum_id, custom_name, curricula(name, code)").eq("school_id", schoolId),
    supabase.from("school_facilities").select("id, branch_id, facility_id, custom_name, description, created_at, facilities(name, code)").eq("school_id", schoolId).order("created_at"),
    supabase.from("school_fees").select("id, branch_id, level_id, class_id, category, custom_category, term, academic_year, amount, currency, notes, created_at, levels(name), school_classes(name), school_branches(name)").eq("school_id", schoolId).order("academic_year", { ascending: false }).order("term"),
    supabase.from("school_admission_requirements").select("id, requirement, sort_order").eq("school_id", schoolId).order("sort_order"),
    supabase.from("school_media").select("id, category, media_type, storage_path, caption, alt_text, moderation_status, verification_status, is_cover, sort_order, created_at").eq("school_id", schoolId).order("is_cover", { ascending: false }).order("sort_order").order("created_at", { ascending: false }).limit(60),
    supabase.from("school_documents").select("id, title, document_type, created_at, expires_at").eq("school_id", schoolId).order("created_at", { ascending: false }),
    supabase.from("verification_records").select("id, verification_type, status, verified_at, expires_at").eq("school_id", schoolId).order("created_at", { ascending: false }),
    supabase.from("school_classes").select("id, name, accepting_applications, level_id, levels(name)").eq("school_id", schoolId).order("name"),
    supabase.from("school_members").select("id, user_id, role, is_active, created_at").eq("school_id", schoolId).eq("is_active", true).order("created_at"),
    supabase.from("reviews").select("id, rating, title, body, status, created_at").eq("school_id", schoolId).order("created_at", { ascending: false }),
    supabase.from("review_responses").select("id, review_id, body, created_at").eq("school_id", schoolId),
    supabase.rpc("school_profile_completion", { target_school_id: schoolId }),
  ]);

  const firstError = [branchResult, levelsResult, curriculaResult, facilitiesResult, feesResult, requirementsResult, mediaResult, documentsResult, verificationResult, classesResult, teamResult, reviewsResult, responsesResult, completionResult].find((result) => result.error)?.error;
  const media = mediaResult.data ?? [];
  const { data: signedUrls } = media.length ? await supabase.storage.from("school-media").createSignedUrls(media.map((item) => item.storage_path), 1800) : { data: [] };
  const mediaUrlByPath = new Map((signedUrls ?? []).map((item) => [item.path, item.signedUrl]));
  const responsesByReviewId = new Map((responsesResult.data ?? []).map((response) => [response.review_id, response]));

  return {
    error: firstError ? "Some school information could not be loaded. Refresh the page to try again." : null,
    completion: Number(completionResult.data ?? 0),
    branches: branchResult.data ?? [],
    mainBranch: (branchResult.data ?? []).find((branch) => branch.is_main) ?? branchResult.data?.[0] ?? null,
    levels: (levelsResult.data ?? []).map((row) => relation(row.levels)).filter((item): item is NonNullable<typeof item> => item !== null).sort((a, b) => a.sort_order - b.sort_order),
    curricula: (curriculaResult.data ?? []).map((row) => { const item = relation(row.curricula); return item ? { ...item, customName: row.custom_name } : null; }).filter((item): item is NonNullable<typeof item> => item !== null),
    facilities: (facilitiesResult.data ?? []).map((row) => ({ ...row, facility: relation(row.facilities) })),
    fees: (feesResult.data ?? []).map((row) => ({ ...row, level: relation(row.levels), schoolClass: relation(row.school_classes), branch: relation(row.school_branches) })),
    requirements: requirementsResult.data ?? [],
    media: media.map((item) => ({ ...item, url: mediaUrlByPath.get(item.storage_path) ?? null })),
    documents: documentsResult.data ?? [],
    verification: verificationResult.data ?? [],
    classes: (classesResult.data ?? []).map((row) => ({ ...row, level: relation(row.levels) })),
    team: teamResult.data ?? [],
    reviews: (reviewsResult.data ?? []).map((review) => ({ ...review, response: responsesByReviewId.get(review.id) ?? null })),
  };
}

export function schoolTypeLabel(value: unknown) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function mediaStatusLabel(value: string) {
  if (value === "pending") return "Under review";
  if (value === "approved") return "Published";
  if (value === "rejected") return "Needs changes";
  return "In progress";
}

export function schoolCoverAndLogo(media: Awaited<ReturnType<typeof getSchoolWorkspaceData>>["media"]) {
  const logo = media.find((item) => item.category === SCHOOL_LOGO_CATEGORY && item.media_type === "image" && item.moderation_status === "approved")
    ?? media.find((item) => item.category === SCHOOL_LOGO_CATEGORY && item.media_type === "image");
  const cover = media.find((item) => item.media_type === "image" && item.is_cover && item.moderation_status === "approved")
    ?? media.find((item) => item.media_type === "image" && item.moderation_status === "approved");
  return { logo: logo?.url ?? null, cover: cover?.url ?? null };
}
