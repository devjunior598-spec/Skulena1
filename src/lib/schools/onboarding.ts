import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAccount } from "@/lib/auth";
import type { OnboardingValues } from "@/lib/validation/school";

export const blankOnboarding: OnboardingValues = {
  step: 1, name: "", slug: "", schoolType: "private", yearEstablished: "", description: "", contactEmail: "", contactPhone: "", websiteUrl: "",
  country: "Nigeria", state: "", city: "", area: "", addressLine: "", latitude: "", longitude: "", levels: [], structure: "day", gender: "mixed",
  curricula: [], facilities: [], feeAmount: "", feeCategory: "tuition", feeTerm: "", academicYear: "", admissionStatus: "closed", admissionDescription: "", requirements: "",
};

export async function getOnboardingDraft() {
  const { user } = await requireAccount(["school_owner"]); const supabase = (await createClient())!;
  const { data: membership } = await supabase.from("school_members").select("school_id, schools(*)").eq("user_id", user.id).eq("role", "owner").eq("is_active", true).limit(1).maybeSingle();
  const schoolRelation = membership?.schools as unknown;
  const school = (Array.isArray(schoolRelation) ? schoolRelation[0] : schoolRelation) as Record<string, unknown> | null | undefined;
  if (!school) return { values: blankOnboarding, completion: 0, completedSteps: [] as number[] };
  const [{ data: branch }, { data: levelRows }, { data: curriculumRows }, { data: facilityRows }, { data: fee }, { data: requirements }, { data: completion }, { count: mediaCount }] = await Promise.all([
    supabase.from("school_branches").select("*").eq("school_id", String(school.id)).eq("is_main", true).maybeSingle(),
    supabase.from("school_levels").select("levels(code)").eq("school_id", String(school.id)),
    supabase.from("school_curricula").select("curricula(code)").eq("school_id", String(school.id)),
    supabase.from("school_facilities").select("facilities(code)").eq("school_id", String(school.id)),
    supabase.from("school_fees").select("amount, category, term, academic_year").eq("school_id", String(school.id)).limit(1).maybeSingle(),
    supabase.from("school_admission_requirements").select("requirement").eq("school_id", String(school.id)).order("sort_order"),
    supabase.rpc("school_profile_completion", { target_school_id: String(school.id) }),
    supabase.from("school_media").select("id", { count: "exact", head: true }).eq("school_id", String(school.id)),
  ]);
  const completedSteps: number[] = [];
  if (String(school.name ?? "").trim() && String(school.slug ?? "").trim() && String(school.description ?? "").trim()) completedSteps.push(1);
  if (branch?.address_line?.trim()) completedSteps.push(2);
  if (levelRows?.length) completedSteps.push(3);
  if (school.structure && school.gender) completedSteps.push(4);
  if (curriculumRows?.length) completedSteps.push(5);
  if (facilityRows?.length) completedSteps.push(6);
  if (fee) completedSteps.push(7);
  if (mediaCount) completedSteps.push(8);
  if (school.admission_description || requirements?.length) completedSteps.push(9);
  return { completion: Number(completion ?? 0), values: {
    ...blankOnboarding, schoolId: String(school.id), name: String(school.name), slug: String(school.slug), schoolType: school.school_type as OnboardingValues["schoolType"],
    yearEstablished: (school.year_established as number | null) ?? "", description: String(school.description ?? ""), contactEmail: String(school.contact_email ?? ""), contactPhone: String(school.contact_phone ?? ""), websiteUrl: String(school.website_url ?? ""),
    country: branch?.country ?? "Nigeria", state: branch?.state ?? "", city: branch?.city ?? "", area: branch?.area ?? "", addressLine: branch?.address_line ?? "", latitude: branch?.latitude ?? "", longitude: branch?.longitude ?? "",
    levels: (levelRows ?? []).map((row) => { const item = Array.isArray(row.levels) ? row.levels[0] : row.levels; return item?.code; }).filter((value): value is string => Boolean(value)), structure: (school.structure as OnboardingValues["structure"] | null) ?? "day", gender: (school.gender as OnboardingValues["gender"] | null) ?? "mixed",
    curricula: (curriculumRows ?? []).map((row) => { const item = Array.isArray(row.curricula) ? row.curricula[0] : row.curricula; return item?.code; }).filter((value): value is string => Boolean(value)), facilities: (facilityRows ?? []).map((row) => { const item = Array.isArray(row.facilities) ? row.facilities[0] : row.facilities; return item?.code; }).filter((value): value is string => Boolean(value)),
    feeAmount: fee?.amount ?? "", feeCategory: (fee?.category as OnboardingValues["feeCategory"] | null) ?? "tuition", feeTerm: fee?.term ?? "", academicYear: fee?.academic_year ?? "", admissionStatus: (school.admission_status as OnboardingValues["admissionStatus"] | null) ?? "closed", admissionDescription: String(school.admission_description ?? ""), requirements: (requirements ?? []).map((row) => row.requirement).join("\n"),
  } satisfies OnboardingValues, completedSteps };
}
