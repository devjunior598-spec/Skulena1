"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schoolIdSchema = z.string().uuid();
const feeCategorySchema = z.enum(["tuition", "registration", "books", "uniform", "transport", "boarding", "other"]);
const statusSchema = z.enum(["open", "closed", "opening_soon"]);

async function editableSchool(formData: FormData) {
  const { user } = await requireAccount(["school_owner", "school_staff"]);
  const schoolId = schoolIdSchema.safeParse(formData.get("schoolId"));
  if (!schoolId.success) redirect("/school/dashboard?error=school");
  const supabase = (await createClient())!;
  const { data: membership } = await supabase.from("school_members").select("role").eq("school_id", schoolId.data).eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (!membership || !["owner", "administrator", "editor"].includes(membership.role)) redirect("/school/dashboard?error=permission");
  return { supabase, schoolId: schoolId.data };
}

export async function switchManagedSchool(formData: FormData) {
  const { user } = await requireAccount(["school_owner", "school_staff"]);
  const schoolId = schoolIdSchema.safeParse(formData.get("schoolId"));
  if (!schoolId.success) redirect("/school/dashboard?error=school");
  const supabase = (await createClient())!;
  const { data: membership } = await supabase.from("school_members").select("id").eq("school_id", schoolId.data).eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (!membership) redirect("/school/dashboard?error=permission");
  (await cookies()).set("skulena_active_school", schoolId.data, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/school", "layout");
  redirect("/school/dashboard");
}

function redirectSaved(path: string, message: string): never {
  revalidatePath("/school/dashboard");
  revalidatePath("/school/profile");
  revalidatePath("/school/facilities");
  revalidatePath("/school/fees");
  revalidatePath("/school/admissions");
  revalidatePath("/school/media");
  revalidatePath("/school/verification");
  revalidatePath("/school/preview");
  redirect(`${path}?saved=${encodeURIComponent(message)}`);
}

export async function saveSchoolSection(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const section = String(formData.get("section") ?? "");
  let error: unknown = null;

  if (section === "about") {
    const name = z.string().trim().min(2).max(160).safeParse(formData.get("name"));
    const description = z.string().trim().max(4000).safeParse(formData.get("description"));
    const schoolType = z.enum(["private", "public", "faith_based", "international", "other"]).safeParse(formData.get("schoolType"));
    const yearText = String(formData.get("yearEstablished") ?? "").trim();
    const year = yearText ? z.coerce.number().int().min(1800).max(new Date().getFullYear()).safeParse(yearText) : { success: true as const, data: null };
    if (!name.success || !description.success || !schoolType.success || !year.success) redirect("/school/profile?error=about");
    const result = await supabase.from("schools").update({ name: name.data, description: description.data || null, school_type: schoolType.data, year_established: year.data }).eq("id", schoolId);
    error = result.error;
  } else if (section === "contact") {
    const emailText = String(formData.get("contactEmail") ?? "").trim();
    const email = emailText ? z.string().email().safeParse(emailText) : { success: true as const, data: "" };
    const phone = z.string().trim().max(30).safeParse(formData.get("contactPhone"));
    const websiteText = String(formData.get("websiteUrl") ?? "").trim();
    const website = websiteText ? z.string().url().safeParse(websiteText) : { success: true as const, data: "" };
    if (!email.success || !phone.success || !website.success) redirect("/school/profile?error=contact");
    const result = await supabase.from("schools").update({ contact_email: email.data || null, contact_phone: phone.data || null, website_url: website.data || null }).eq("id", schoolId);
    error = result.error;
  } else if (section === "location") {
    const branchIdText = String(formData.get("branchId") ?? "");
    const branchId = branchIdText ? z.string().uuid().safeParse(branchIdText) : null;
    if (branchId && !branchId.success) redirect("/school/profile?error=location");
    const country = z.string().trim().min(2).max(80).safeParse(formData.get("country") || "Nigeria");
    const state = z.string().trim().max(80).safeParse(formData.get("state") || "");
    const city = z.string().trim().max(80).safeParse(formData.get("city") || "");
    const area = z.string().trim().max(120).safeParse(formData.get("area") || "");
    const address = z.string().trim().max(300).safeParse(formData.get("addressLine") || "");
    if (!country.success || !state.success || !city.success || !area.success || !address.success) redirect("/school/profile?error=location");
    const fields = { country: country.data, state: state.data || null, city: city.data || null, area: area.data || null, address_line: address.data || null };
    if (branchId) {
      const result = await supabase.from("school_branches").update(fields).eq("id", branchId.data).eq("school_id", schoolId).select("id").maybeSingle();
      error = result.error ?? (result.data ? null : { message: "Missing branch" });
    } else {
      const { data: mainBranch, error: readError } = await supabase.from("school_branches").select("id").eq("school_id", schoolId).eq("is_main", true).maybeSingle();
      if (readError) error = readError;
      else if (mainBranch) {
        const result = await supabase.from("school_branches").update(fields).eq("id", mainBranch.id).eq("school_id", schoolId);
        error = result.error;
      } else {
        const result = await supabase.from("school_branches").insert({ ...fields, name: "Main campus", school_id: schoolId, is_main: true });
        error = result.error;
      }
    }
  } else if (section === "structure") {
    const structure = z.enum(["day", "boarding", "day_and_boarding"]).safeParse(formData.get("structure"));
    const gender = z.enum(["mixed", "boys", "girls"]).safeParse(formData.get("gender"));
    if (!structure.success || !gender.success) redirect("/school/profile?error=structure");
    const result = await supabase.from("schools").update({ structure: structure.data, gender: gender.data }).eq("id", schoolId);
    error = result.error;
  }
  if (error || !["about", "contact", "location", "structure"].includes(section)) redirect("/school/profile?error=save");
  redirectSaved("/school/profile", "profile");
}

export async function saveLearningDetails(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const levelCodes = [...new Set(formData.getAll("levelCodes").map(String))];
  const curriculumCodes = [...new Set(formData.getAll("curriculumCodes").map(String))];
  if (levelCodes.length > 5 || curriculumCodes.length > 7) redirect("/school/profile?error=learning");
  const [levels, curricula, currentLevels, currentCurricula] = await Promise.all([
    levelCodes.length ? supabase.from("levels").select("id, code").in("code", levelCodes) : Promise.resolve({ data: [], error: null }),
    curriculumCodes.length ? supabase.from("curricula").select("id, code").in("code", curriculumCodes) : Promise.resolve({ data: [], error: null }),
    supabase.from("school_levels").select("level_id").eq("school_id", schoolId),
    supabase.from("school_curricula").select("curriculum_id, custom_name").eq("school_id", schoolId),
  ]);
  if (levels.error || curricula.error || currentLevels.error || currentCurricula.error || (levels.data?.length ?? 0) !== levelCodes.length || (curricula.data?.length ?? 0) !== curriculumCodes.length) redirect("/school/profile?error=learning");
  const selectedLevelIds = (levels.data ?? []).map((item) => item.id);
  const selectedCurriculumIds = (curricula.data ?? []).map((item) => item.id);
  const missingLevels = (levels.data ?? []).filter((item) => !currentLevels.data?.some((current) => current.level_id === item.id));
  const missingCurricula = (curricula.data ?? []).filter((item) => !currentCurricula.data?.some((current) => current.curriculum_id === item.id));
  if (missingLevels.length) {
    const insert = await supabase.from("school_levels").insert(missingLevels.map((item) => ({ school_id: schoolId, level_id: item.id })));
    if (insert.error) redirect("/school/profile?error=learning");
  }
  if (missingCurricula.length) {
    const insert = await supabase.from("school_curricula").insert(missingCurricula.map((item) => ({ school_id: schoolId, curriculum_id: item.id })));
    if (insert.error) redirect("/school/profile?error=learning");
  }
  const removeLevels = (currentLevels.data ?? []).filter((item) => !selectedLevelIds.includes(item.level_id)).map((item) => item.level_id);
  const removeCurricula = (currentCurricula.data ?? []).filter((item) => !item.custom_name && !selectedCurriculumIds.includes(item.curriculum_id)).map((item) => item.curriculum_id);
  if (removeLevels.length) {
    const remove = await supabase.from("school_levels").delete().eq("school_id", schoolId).in("level_id", removeLevels);
    if (remove.error) redirect("/school/profile?error=learning");
  }
  if (removeCurricula.length) {
    const remove = await supabase.from("school_curricula").delete().eq("school_id", schoolId).in("curriculum_id", removeCurricula);
    if (remove.error) redirect("/school/profile?error=learning");
  }
  redirectSaved("/school/profile", "profile");
}

export async function saveAdmissionDetails(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const status = statusSchema.safeParse(formData.get("admissionStatus"));
  const description = z.string().trim().max(3000).safeParse(formData.get("admissionDescription"));
  const rawRequirements = z.string().max(4000).safeParse(formData.get("requirements"));
  if (!status.success || !description.success || !rawRequirements.success) redirect("/school/admissions?error=details");
  const update = await supabase.from("schools").update({ admission_status: status.data, admission_description: description.data || null }).eq("id", schoolId);
  if (update.error) redirect("/school/admissions?error=save");

  const nextRequirements = [...new Set(rawRequirements.data.split("\n").map((value) => value.trim()).filter((value) => value.length >= 2 && value.length <= 500))];
  const { data: current, error: readError } = await supabase.from("school_admission_requirements").select("id, requirement, sort_order").eq("school_id", schoolId);
  if (readError) redirect("/school/admissions?error=save");
  const currentRows = current ?? [];
  const toInsert = nextRequirements.filter((value) => !currentRows.some((row) => row.requirement === value));
  if (toInsert.length) {
    const insert = await supabase.from("school_admission_requirements").insert(toInsert.map((requirement, index) => ({ school_id: schoolId, requirement, sort_order: currentRows.length + index })));
    if (insert.error) redirect("/school/admissions?error=save");
  }
  const toDelete = currentRows.filter((row) => !nextRequirements.includes(row.requirement)).map((row) => row.id);
  if (toDelete.length) {
    const remove = await supabase.from("school_admission_requirements").delete().in("id", toDelete).eq("school_id", schoolId);
    if (remove.error) redirect("/school/admissions?error=save");
  }
  redirectSaved("/school/admissions", "admissions");
}

export async function addFacility(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const code = z.string().trim().min(1).max(80).safeParse(formData.get("facilityCode"));
  const description = z.string().trim().max(800).safeParse(formData.get("description"));
  const branchIdText = String(formData.get("branchId") ?? "");
  const branchId = branchIdText ? z.string().uuid().safeParse(branchIdText) : null;
  if (!code.success || !description.success || (branchId && !branchId.success)) redirect("/school/facilities?error=details");
  if (branchId?.success) {
    const { data: branch } = await supabase.from("school_branches").select("id").eq("school_id", schoolId).eq("id", branchId.data).maybeSingle();
    if (!branch) redirect("/school/facilities?error=details");
  }
  const { data: facility, error: facilityError } = await supabase.from("facilities").select("id").eq("code", code.data).maybeSingle();
  if (facilityError || !facility) redirect("/school/facilities?error=save");
  const result = await supabase.from("school_facilities").insert({ school_id: schoolId, facility_id: facility.id, branch_id: branchId?.success ? branchId.data : null, description: description.data || null });
  if (result.error) redirect(`/school/facilities?error=${result.error.code === "23505" ? "duplicate" : "save"}`);
  redirectSaved("/school/facilities", "facility");
}

export async function deleteFacility(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const id = z.string().uuid().safeParse(formData.get("facilityId"));
  if (!id.success) redirect("/school/facilities?error=save");
  const result = await supabase.from("school_facilities").delete().eq("school_id", schoolId).eq("id", id.data);
  if (result.error) redirect("/school/facilities?error=save");
  redirectSaved("/school/facilities", "facility-removed");
}

function readFee(formData: FormData) {
  const category = feeCategorySchema.safeParse(formData.get("category"));
  const customCategory = z.string().trim().max(80).safeParse(formData.get("customCategory") ?? "");
  const amount = z.coerce.number().finite().min(0).max(100000000).safeParse(formData.get("amount"));
  const term = z.string().trim().max(40).safeParse(formData.get("term"));
  const academicYear = z.string().trim().regex(/^\d{4}\/\d{4}$/).refine((value) => Number(value.slice(5)) === Number(value.slice(0, 4)) + 1).safeParse(formData.get("academicYear"));
  const notes = z.string().trim().max(500).safeParse(formData.get("notes"));
  return category.success && customCategory.success && amount.success && term.success && academicYear.success && notes.success
    ? { success: true as const, data: { category: category.data, custom_category: category.data === "other" ? customCategory.data || null : null, amount: amount.data, term: term.data || null, academic_year: academicYear.data, notes: notes.data || null, currency: "NGN" } }
    : { success: false as const };
}

export async function saveFee(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const parsed = readFee(formData);
  if (!parsed.success) redirect("/school/fees?error=fee-details");
  const id = String(formData.get("feeId") ?? "");
  const feeId = id ? z.string().uuid().safeParse(id) : null;
  if (feeId && !feeId.success) redirect("/school/fees?error=details");
  const result = feeId
    ? await supabase.from("school_fees").update(parsed.data).eq("school_id", schoolId).eq("id", feeId.data)
    : await supabase.from("school_fees").insert({ ...parsed.data, school_id: schoolId });
  if (result.error) redirect("/school/fees?error=save");
  redirectSaved("/school/fees", "fee");
}

export async function deleteFee(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const feeId = z.string().uuid().safeParse(formData.get("feeId"));
  if (!feeId.success) redirect("/school/fees?error=save");
  const result = await supabase.from("school_fees").delete().eq("school_id", schoolId).eq("id", feeId.data);
  if (result.error) redirect("/school/fees?error=save");
  redirectSaved("/school/fees", "fee-removed");
}

export async function updateSchoolMedia(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const mediaId = z.string().uuid().safeParse(formData.get("mediaId"));
  const category = z.string().trim().min(2).max(80).safeParse(formData.get("category"));
  const caption = z.string().trim().max(300).safeParse(formData.get("caption"));
  if (!mediaId.success || !category.success || !caption.success) redirect("/school/media?error=save");
  const result = await supabase.from("school_media").update({ category: category.data, caption: caption.data || null }).eq("school_id", schoolId).eq("id", mediaId.data);
  if (result.error) redirect("/school/media?error=save");
  redirectSaved("/school/media", "media");
}

export async function setSchoolMediaCover(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const mediaId = z.string().uuid().safeParse(formData.get("mediaId"));
  if (!mediaId.success) redirect("/school/media?error=cover");
  const { data: item } = await supabase.from("school_media").select("id, media_type, moderation_status").eq("school_id", schoolId).eq("id", mediaId.data).maybeSingle();
  if (!item || item.media_type !== "image" || item.moderation_status !== "approved") redirect("/school/media?error=cover");
  const clear = await supabase.from("school_media").update({ is_cover: false }).eq("school_id", schoolId).eq("is_cover", true).neq("id", mediaId.data);
  if (clear.error) redirect("/school/media?error=cover");
  const set = await supabase.from("school_media").update({ is_cover: true }).eq("school_id", schoolId).eq("id", mediaId.data);
  if (set.error) redirect("/school/media?error=cover");
  revalidatePath("/school/media");
  revalidatePath("/school/profile");
  revalidatePath("/school/preview");
  redirect("/school/media?saved=cover");
}

export async function deleteSchoolMedia(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const mediaId = z.string().uuid().safeParse(formData.get("mediaId"));
  if (!mediaId.success) redirect("/school/media?error=save");
  const { data: item, error: readError } = await supabase.from("school_media").select("id, storage_path").eq("school_id", schoolId).eq("id", mediaId.data).maybeSingle();
  if (readError || !item) redirect("/school/media?error=save");
  const storage = await supabase.storage.from("school-media").remove([item.storage_path]);
  if (storage.error) redirect("/school/media?error=save");
  const result = await supabase.from("school_media").delete().eq("school_id", schoolId).eq("id", mediaId.data);
  if (result.error) redirect("/school/media?error=save");
  redirectSaved("/school/media", "media-removed");
}

export async function moveSchoolMedia(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const mediaId = z.string().uuid().safeParse(formData.get("mediaId"));
  const direction = z.enum(["up", "down"]).safeParse(formData.get("direction"));
  if (!mediaId.success || !direction.success) redirect("/school/media?error=save");
  const { data: items, error } = await supabase.from("school_media").select("id, sort_order, created_at").eq("school_id", schoolId).order("sort_order").order("created_at", { ascending: false }).limit(60);
  if (error) redirect("/school/media?error=save");
  const ordered = items ?? [];
  const index = ordered.findIndex((item) => item.id === mediaId.data);
  const otherIndex = direction.data === "up" ? index - 1 : index + 1;
  if (index < 0 || otherIndex < 0 || otherIndex >= ordered.length) redirect("/school/media");
  const [first, second] = [ordered[index], ordered[otherIndex]];
  const firstOrder = first.sort_order;
  const secondOrder = second.sort_order;
  const saveFirst = await supabase.from("school_media").update({ sort_order: secondOrder }).eq("school_id", schoolId).eq("id", first.id);
  const saveSecond = saveFirst.error ? null : await supabase.from("school_media").update({ sort_order: firstOrder }).eq("school_id", schoolId).eq("id", second.id);
  if (saveFirst.error || saveSecond?.error) redirect("/school/media?error=save");
  revalidatePath("/school/media");
  redirect("/school/media?saved=media");
}

export async function respondToReview(formData: FormData) {
  const { supabase, schoolId } = await editableSchool(formData);
  const reviewId = z.string().uuid().safeParse(formData.get("reviewId"));
  const body = z.string().trim().min(2).max(4000).safeParse(formData.get("body"));
  if (!reviewId.success || !body.success) redirect("/school/reviews?error=details");
  const { data: review } = await supabase.from("reviews").select("id, status").eq("school_id", schoolId).eq("id", reviewId.data).maybeSingle();
  if (!review || review.status !== "published") redirect("/school/reviews?error=save");
  const { data: current } = await supabase.from("review_responses").select("id").eq("school_id", schoolId).eq("review_id", reviewId.data).maybeSingle();
  const result = current
    ? await supabase.from("review_responses").update({ body: body.data }).eq("school_id", schoolId).eq("id", current.id)
    : await supabase.from("review_responses").insert({ school_id: schoolId, review_id: reviewId.data, author_id: (await requireAccount(["school_owner", "school_staff"])).user.id, body: body.data });
  if (result.error) redirect("/school/reviews?error=save");
  revalidatePath("/school/reviews");
  redirect("/school/reviews?saved=reply");
}

export async function markSchoolNotificationRead(formData: FormData) {
  const { user } = await requireAccount(["school_owner", "school_staff"]);
  const id = z.string().uuid().safeParse(formData.get("notificationId"));
  if (!id.success) redirect("/school/notifications?error=save");
  const supabase = (await createClient())!;
  const { data: notification } = await supabase.from("notifications").select("id, href").eq("id", id.data).eq("recipient_id", user.id).maybeSingle();
  if (!notification) redirect("/school/notifications?error=save");
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id.data).eq("recipient_id", user.id);
  if (error) redirect("/school/notifications?error=save");
  revalidatePath("/school/notifications");
  revalidatePath("/school/dashboard");
  const target = typeof notification.href === "string" && notification.href.startsWith("/") && !notification.href.startsWith("//") ? notification.href : "/school/notifications";
  redirect(target);
}
