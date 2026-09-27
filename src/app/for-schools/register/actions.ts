"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingValues } from "@/lib/validation/school";
import { z } from "zod";

export type SubmissionRequirement = { step: number; label: string; instruction: string; complete: boolean };
type SaveResult = { schoolId?: string; completion?: number; error?: string; submitted?: boolean; requirements?: SubmissionRequirement[] };

const schoolIdSchema = z.string().uuid();

async function loadSubmissionRequirements(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string, schoolId: string) {
  const { data: membership, error: membershipError } = await supabase.from("school_members").select("id").eq("school_id", schoolId).eq("user_id", userId).eq("is_active", true).in("role", ["owner", "administrator"]).maybeSingle();
  if (membershipError || !membership) return { error: "We couldn’t verify access to this school profile." } as const;

  const [schoolResult, branchResult, levelsResult, curriculaResult] = await Promise.all([
    supabase.from("schools").select("description").eq("id", schoolId).maybeSingle(),
    supabase.from("school_branches").select("address_line").eq("school_id", schoolId).eq("is_main", true).maybeSingle(),
    supabase.from("school_levels").select("level_id").eq("school_id", schoolId),
    supabase.from("school_curricula").select("curriculum_id").eq("school_id", schoolId),
  ]);
  if (schoolResult.error || branchResult.error || levelsResult.error || curriculaResult.error || !schoolResult.data) {
    return { error: "We couldn’t check the required school details. Please try again." } as const;
  }

  const requirements: SubmissionRequirement[] = [
    { step: 1, label: "School description", instruction: "Add a short, accurate introduction in Basic information.", complete: Boolean(schoolResult.data.description?.trim()) },
    { step: 2, label: "Full school address", instruction: "Add the school’s street address in Location.", complete: Boolean(branchResult.data?.address_line?.trim()) },
    { step: 3, label: "At least one level", instruction: "Select at least one level the school offers.", complete: Boolean(levelsResult.data?.length) },
    { step: 5, label: "At least one curriculum", instruction: "Select at least one curriculum the school uses.", complete: Boolean(curriculaResult.data?.length) },
  ];
  return { requirements } as const;
}

export async function getSchoolSubmissionRequirements(schoolId: string) {
  const { user } = await requireAccount(["school_owner"]);
  const parsedId = schoolIdSchema.safeParse(schoolId);
  if (!parsedId.success) return { error: "We couldn’t verify the selected school profile." };
  const supabase = (await createClient())!;
  return loadSubmissionRequirements(supabase, user.id, parsedId.data);
}

export async function saveOnboardingStep(values: OnboardingValues): Promise<SaveResult> {
  await requireAccount(["school_owner"]);
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check this step and try again." };
  const input = parsed.data;
  const supabase = (await createClient())!;
  let schoolId = input.schoolId;

  if (!schoolId) {
    const { data, error } = await supabase.rpc("create_school_draft", { school_name: input.name, school_slug: input.slug, initial_country: input.country });
    if (error || !data) return { error: error?.message.includes("duplicate") ? "That school address is already in use." : "We couldn’t create the draft." };
    schoolId = data as string;
  }

  let error: { code?: string; message: string } | null = null;
  if (input.step === 1) {
    ({ error } = await supabase.from("schools").update({ name: input.name, slug: input.slug, school_type: input.schoolType, year_established: input.yearEstablished || null, description: input.description || null, contact_email: input.contactEmail || null, contact_phone: input.contactPhone || null, website_url: input.websiteUrl || null }).eq("id", schoolId));
  } else if (input.step === 2) {
    ({ error } = await supabase.from("school_branches").update({ country: input.country, state: input.state || null, city: input.city || null, area: input.area || null, address_line: input.addressLine || null, latitude: input.latitude || null, longitude: input.longitude || null }).eq("school_id", schoolId).eq("is_main", true));
  } else if (input.step === 3) {
    const { data: rows, error: catalogError } = input.levels.length ? await supabase.from("levels").select("id, code").in("code", input.levels) : { data: [], error: null };
    const { data: current, error: readError } = await supabase.from("school_levels").select("level_id").eq("school_id", schoolId);
    if (catalogError || readError || (rows?.length ?? 0) !== input.levels.length) error = catalogError ?? readError ?? { code: "invalid_catalog", message: "Unknown school level" };
    else {
      const selected = rows ?? [];
      const currentRows = current ?? [];
      const missing = selected.filter((row) => !currentRows.some((item) => item.level_id === row.id));
      if (missing.length) ({ error } = await supabase.from("school_levels").insert(missing.map((row) => ({ school_id: schoolId, level_id: row.id }))));
      if (!error) {
        const removed = currentRows.filter((item) => !selected.some((row) => row.id === item.level_id)).map((item) => item.level_id);
        if (removed.length) ({ error } = await supabase.from("school_levels").delete().eq("school_id", schoolId).in("level_id", removed));
      }
    }
  } else if (input.step === 4) {
    ({ error } = await supabase.from("schools").update({ structure: input.structure, gender: input.gender }).eq("id", schoolId));
  } else if (input.step === 5) {
    const { data: rows, error: catalogError } = input.curricula.length ? await supabase.from("curricula").select("id, code").in("code", input.curricula) : { data: [], error: null };
    const { data: current, error: readError } = await supabase.from("school_curricula").select("curriculum_id, custom_name").eq("school_id", schoolId);
    if (catalogError || readError || (rows?.length ?? 0) !== input.curricula.length) error = catalogError ?? readError ?? { code: "invalid_catalog", message: "Unknown curriculum" };
    else {
      const selected = rows ?? [];
      const currentRows = current ?? [];
      const missing = selected.filter((row) => !currentRows.some((item) => item.curriculum_id === row.id));
      if (missing.length) ({ error } = await supabase.from("school_curricula").insert(missing.map((row) => ({ school_id: schoolId, curriculum_id: row.id }))));
      if (!error) {
        const removed = currentRows.filter((item) => !item.custom_name && !selected.some((row) => row.id === item.curriculum_id)).map((item) => item.curriculum_id);
        if (removed.length) ({ error } = await supabase.from("school_curricula").delete().eq("school_id", schoolId).in("curriculum_id", removed));
      }
    }
  } else if (input.step === 6) {
    const { data: rows, error: catalogError } = input.facilities.length ? await supabase.from("facilities").select("id, code").in("code", input.facilities) : { data: [], error: null };
    const { data: current, error: readError } = await supabase.from("school_facilities").select("facility_id, branch_id, custom_name, description").eq("school_id", schoolId);
    if (catalogError || readError || (rows?.length ?? 0) !== input.facilities.length) error = catalogError ?? readError ?? { code: "invalid_catalog", message: "Unknown facility" };
    else {
      const selected = rows ?? [];
      const currentRows = current ?? [];
      const missing = selected.filter((row) => !currentRows.some((item) => item.facility_id === row.id));
      if (missing.length) ({ error } = await supabase.from("school_facilities").insert(missing.map((row) => ({ school_id: schoolId, facility_id: row.id }))));
      if (!error) {
        // The setup checklist may add/remove simple school-wide choices, but it must not erase branch-specific or described facility entries.
        const removed = currentRows.filter((item) => !item.branch_id && !item.custom_name && !item.description && !selected.some((row) => row.id === item.facility_id)).map((item) => item.facility_id);
        if (removed.length) ({ error } = await supabase.from("school_facilities").delete().eq("school_id", schoolId).is("branch_id", null).is("custom_name", null).is("description", null).in("facility_id", removed));
      }
    }
  } else if (input.step === 7 && input.feeAmount !== "" && input.academicYear) {
    const { data: existingFees, error: feeReadError } = await supabase.from("school_fees").select("id").eq("school_id", schoolId).order("created_at", { ascending: true }).limit(1);
    if (feeReadError) error = feeReadError;
    else if (existingFees?.[0]) ({ error } = await supabase.from("school_fees").update({ category: input.feeCategory, term: input.feeTerm || null, academic_year: input.academicYear, amount: input.feeAmount }).eq("school_id", schoolId).eq("id", existingFees[0].id));
    else ({ error } = await supabase.from("school_fees").insert({ school_id: schoolId, category: input.feeCategory, term: input.feeTerm || null, academic_year: input.academicYear, amount: input.feeAmount }));
  } else if (input.step === 9) {
    ({ error } = await supabase.from("schools").update({ admission_status: input.admissionStatus, admission_description: input.admissionDescription || null }).eq("id", schoolId));
    if (!error) {
      const requirements = [...new Set(input.requirements.split("\n").map((value) => value.trim()).filter(Boolean))];
      const { data: existing, error: readError } = await supabase.from("school_admission_requirements").select("id, requirement, sort_order").eq("school_id", schoolId);
      if (readError) error = readError;
      else {
        const existingRows = existing ?? [];
        const missing = requirements.filter((requirement) => !existingRows.some((item) => item.requirement === requirement));
        if (missing.length) ({ error } = await supabase.from("school_admission_requirements").insert(missing.map((requirement, index) => ({ school_id: schoolId, requirement, sort_order: existingRows.length + index }))));
        if (!error) {
          const removed = existingRows.filter((item) => !requirements.includes(item.requirement)).map((item) => item.id);
          if (removed.length) ({ error } = await supabase.from("school_admission_requirements").delete().eq("school_id", schoolId).in("id", removed));
        }
      }
    }
  }
  if (error) {
    console.error("[school-registration] step save failed", { step: input.step, schoolId, code: error.code ?? "unknown" });
    return { schoolId, error: error.code === "23505" && input.step === 1 ? "That profile address is already in use." : "We couldn’t save this step. Your earlier progress is still safe." };
  }
  const { data: completion } = await supabase.rpc("school_profile_completion", { target_school_id: schoolId });
  revalidatePath("/school/dashboard");
  revalidatePath("/school/profile");
  revalidatePath("/school/facilities");
  revalidatePath("/school/fees");
  revalidatePath("/school/admissions");
  revalidatePath("/school/media");
  revalidatePath("/school/verification");
  revalidatePath("/school/preview");
  return { schoolId, completion: Number(completion ?? 0) };
}

export async function submitSchool(schoolId: string): Promise<SaveResult> {
  const { user } = await requireAccount(["school_owner"]);
  const parsedId = schoolIdSchema.safeParse(schoolId);
  if (!parsedId.success) return { error: "We couldn’t verify the selected school profile." };
  const supabase = (await createClient())!;
  const readiness = await loadSubmissionRequirements(supabase, user.id, parsedId.data);
  if ("error" in readiness) return { schoolId, error: readiness.error };
  const missing = readiness.requirements.filter((requirement) => !requirement.complete);
  if (missing.length) return { schoolId, requirements: readiness.requirements, error: `Before you submit, please complete: ${missing.map((requirement) => requirement.label).join(", ")}.` };
  const { error } = await supabase.rpc("submit_school", { target_school_id: parsedId.data });
  if (error) {
    console.error("[school-registration] submission rejected", { schoolId, code: error.code ?? "unknown" });
    return { schoolId, requirements: readiness.requirements, error: "We couldn’t submit the profile yet. Your saved draft is safe. Review the checklist and try again." };
  }
  revalidatePath("/school/dashboard");
  revalidatePath("/school/profile");
  revalidatePath("/school/preview");
  return { schoolId, submitted: true };
}
