"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const applicationStatuses = ["received", "under_review", "information_required", "visit_required", "assessment_required", "interview_required", "decision_pending", "declined", "cancelled", "enrolled"] as const;
const visitStatuses = ["confirmed", "reschedule_proposed", "cancelled", "completed", "no_show"] as const;

function appPath(id: string) { return `/parent/applications/${id}`; }
function schoolAppPath(id: string) { return `/school/applications/${id}`; }
function fail(path: string, code: string): never { redirect(`${path}?error=${encodeURIComponent(code)}`); }
async function requireSchoolAdmissions(formData: FormData) {
  const { user } = await requireAccount(["school_owner", "school_staff"]);
  const schoolId = idSchema.safeParse(formData.get("schoolId"));
  if (!schoolId.success) fail("/school/admissions", "school");
  const supabase = await createClient();
  if (!supabase) fail("/school/admissions", "database");
  const { data: membership } = await supabase.from("school_members").select("role").eq("school_id", schoolId.data).eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (!membership || !["owner", "administrator", "admissions"].includes(membership.role)) fail("/school/admissions", "permission");
  return { supabase, user, schoolId: schoolId.data };
}

async function requireApplicationAccess(applicationId: string) {
  const account = await requireAccount();
  const supabase = await createClient();
  if (!supabase) fail(account.profile.role === "parent" ? "/parent/applications" : "/school/applications", "database");
  const parsed = idSchema.safeParse(applicationId);
  if (!parsed.success) fail("/", "application");
  const { data: application } = await supabase.from("admission_applications")
    .select("id, application_number, parent_id, school_id, child_id, branch_id, class_id, class_name, academic_year, term, status, visit_preference")
    .eq("id", parsed.data).maybeSingle();
  if (!application) fail(account.profile.role === "parent" ? "/parent/applications" : "/school/applications", "not-found");
  const isParent = application.parent_id === account.user.id && account.profile.role === "parent";
  const { data: membership } = !isParent && ["school_owner", "school_staff"].includes(account.profile.role)
    ? await supabase.from("school_members").select("role").eq("school_id", application.school_id).eq("user_id", account.user.id).eq("is_active", true).maybeSingle()
    : { data: null };
  const isAdmissions = !!membership && ["owner", "administrator", "admissions"].includes(membership.role);
  if (!isParent && !isAdmissions) fail("/", "permission");
  return { supabase, user: account.user, profile: account.profile, application, isParent, isAdmissions };
}

export async function createAdmissionApplication(formData: FormData): Promise<{ applicationId: string }> {
  const { user, profile } = await requireAccount(["parent"]);
  const supabase = await createClient();
  if (!supabase) fail("/parent/applications", "database");

  const schoolId = idSchema.safeParse(formData.get("schoolId"));
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(formData.get("schoolSlug"));
  const formPath = slug.success ? `/school/${slug.data}/apply` : "/parent/applications";
  const childId = idSchema.safeParse(formData.get("childId"));
  const classId = idSchema.safeParse(formData.get("classId"));
  const branchText = String(formData.get("branchId") ?? "");
  const branchId = branchText ? idSchema.safeParse(branchText) : null;
  const guardianName = z.string().trim().min(2).max(160).safeParse(formData.get("guardianName") || profile.full_name);
  const guardianEmail = z.string().trim().email().max(254).safeParse(formData.get("guardianEmail") || user.email);
  const guardianPhone = z.string().trim().max(30).safeParse(formData.get("guardianPhone") || "");
  const relationship = z.string().trim().max(80).safeParse(formData.get("relationship") || "");
  const previousSchool = z.string().trim().max(200).safeParse(formData.get("previousSchool") || "");
  const previousClass = z.string().trim().max(120).safeParse(formData.get("previousClass") || "");
  const visitPreference = z.enum(["request_visit", "no_visit"]).safeParse(formData.get("visitPreference") || "no_visit");
  const assessmentPreference = z.enum(["in_person", "online", "no_preference"]).safeParse(formData.get("assessmentPreference") || "no_preference");
  const existingApplicationText = String(formData.get("applicationId") ?? "").trim();
  const existingApplicationId = existingApplicationText ? idSchema.safeParse(existingApplicationText) : null;
  if (!schoolId.success || !childId.success || !classId.success || (branchId && !branchId.success)
    || !guardianName.success || !guardianEmail.success || !guardianPhone.success || !relationship.success
    || !previousSchool.success || !previousClass.success || !visitPreference.success || !assessmentPreference.success
    || (existingApplicationId && !existingApplicationId.success)) {
    fail(formPath, "details");
  }

  const [{ data: child }, { data: settings }, { data: classRow }, { data: school }] = await Promise.all([
    supabase.from("children").select("id").eq("id", childId.data).eq("parent_id", user.id).maybeSingle(),
    supabase.from("school_admission_settings").select("academic_year, term, applications_enabled, opens_at, closes_at, instructions, visits_enabled, assessments_enabled").eq("school_id", schoolId.data).maybeSingle(),
    supabase.from("school_classes").select("id, school_id, name, branch_id, accepting_applications").eq("id", classId.data).maybeSingle(),
    supabase.from("public_school_profiles").select("id, slug, name, admission_status").eq("id", schoolId.data).maybeSingle(),
  ]);
  if (!child || !school || school.admission_status !== "open" || !settings?.applications_enabled || !settings.academic_year || !settings.term
    || !classRow || classRow.school_id !== schoolId.data || !classRow.accepting_applications
    || (settings.opens_at && new Date(settings.opens_at) > new Date()) || (settings.closes_at && new Date(settings.closes_at) < new Date())) {
    fail(formPath, "not-open");
  }
  if (branchId?.success && classRow.branch_id && branchId.data !== classRow.branch_id) fail(formPath, "class-branch");

  const { data: questions, error: questionError } = await supabase.from("school_application_questions")
    .select("id, prompt, answer_type, options, is_required").eq("school_id", schoolId.data).eq("is_active", true).order("sort_order");
  if (questionError) fail(formPath, "questions");
  const answers = (questions ?? []).flatMap((question) => {
    const answer = String(formData.get(`question_${question.id}`) ?? "").trim();
    if (!answer) return [];
    if (question.answer_type === "yes_no" && !["yes", "no"].includes(answer)) fail(formPath, "answers");
    if (question.answer_type === "select" && !(Array.isArray(question.options) ? question.options : []).includes(answer)) fail(formPath, "answers");
    return [{ question_id: question.id, question_snapshot: question.prompt, answer }];
  });
  const applicationValues = {
    parent_id: user.id,
    child_id: child.id,
    school_id: schoolId.data,
    branch_id: branchId?.success ? branchId.data : classRow.branch_id,
    class_id: classRow.id,
    class_name: classRow.name,
    academic_year: settings.academic_year,
    term: settings.term,
    guardian_name: guardianName.data,
    guardian_email: guardianEmail.data,
    guardian_phone: guardianPhone.data || null,
    guardian_relationship: relationship.data || null,
    previous_school: previousSchool.data || null,
    previous_class: previousClass.data || null,
    visit_preference: visitPreference.data,
    assessment_preference: assessmentPreference.data,
    payment_preference: "pay_school_directly",
    status: "draft",
  };
  let savedApplicationId: string;
  if (existingApplicationId?.success) {
    const { data: existing } = await supabase.from("admission_applications")
      .select("id, school_id, status").eq("id", existingApplicationId.data).eq("parent_id", user.id).maybeSingle();
    if (!existing || existing.school_id !== schoolId.data || existing.status !== "draft") fail(formPath, "draft-locked");
    const { error } = await supabase.from("admission_applications").update({
      child_id: applicationValues.child_id,
      branch_id: applicationValues.branch_id,
      class_id: applicationValues.class_id,
      class_name: applicationValues.class_name,
      academic_year: applicationValues.academic_year,
      term: applicationValues.term,
      guardian_name: applicationValues.guardian_name,
      guardian_email: applicationValues.guardian_email,
      guardian_phone: applicationValues.guardian_phone,
      guardian_relationship: applicationValues.guardian_relationship,
      previous_school: applicationValues.previous_school,
      previous_class: applicationValues.previous_class,
      visit_preference: applicationValues.visit_preference,
      assessment_preference: applicationValues.assessment_preference,
    })
      .eq("id", existing.id).eq("parent_id", user.id).eq("status", "draft");
    if (error) fail(formPath, "save");
    savedApplicationId = existing.id;
  } else {
    const { data: application, error: insertError } = await supabase.from("admission_applications").insert(applicationValues).select("id").single();
    if (insertError || !application) fail(formPath, insertError?.code === "23505" ? "duplicate" : "save");
    savedApplicationId = application.id;
  }

  const { data: priorAnswers, error: priorAnswersError } = await supabase.from("admission_application_answers")
    .select("question_id").eq("application_id", savedApplicationId);
  if (priorAnswersError || !priorAnswers) fail(appPath(savedApplicationId), "answers-save");
  const nextQuestionIds = new Set(answers.map((answer) => answer.question_id));
  const removedQuestionIds = priorAnswers.map((answer) => answer.question_id).filter((questionId) => !nextQuestionIds.has(questionId));
  if (removedQuestionIds.length) {
    const { error } = await supabase.from("admission_application_answers").delete()
      .eq("application_id", savedApplicationId).in("question_id", removedQuestionIds);
    if (error) fail(appPath(savedApplicationId), "answers-save");
  }
  if (answers.length) {
    const { error } = await supabase.from("admission_application_answers").upsert(
      answers.map((answer) => ({ ...answer, application_id: savedApplicationId })),
      { onConflict: "application_id,question_id" },
    );
    if (error) fail(appPath(savedApplicationId), "answers-save");
  }
  // Application creation always starts as a private draft. The parent wizard
  // uploads documents directly to private Storage after it has an application
  // UUID, then explicitly submits with the separate consent action.
  revalidatePath("/parent/applications");
  return { applicationId: savedApplicationId };
}

export async function submitDraftApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, user, application, isParent } = await requireApplicationAccess(applicationId);
  if (!isParent || application.status !== "draft") fail(appPath(application.id), "permission");
  if (formData.get("consentAccepted") !== "on") fail(appPath(application.id), "consent");
  const visitPreference = z.enum(["request_visit", "no_visit"]).safeParse(formData.get("visitPreference") ?? application.visit_preference ?? "no_visit");
  const assessmentPreference = z.enum(["in_person", "online", "no_preference"]).safeParse(formData.get("assessmentPreference") ?? "no_preference");
  if (!visitPreference.success || !assessmentPreference.success) fail(appPath(application.id), "details");
  const [{ data: requiredQuestions }, { data: existingAnswers }] = await Promise.all([
    supabase.from("school_application_questions").select("id").eq("school_id", application.school_id).eq("is_active", true).eq("is_required", true),
    supabase.from("admission_application_answers").select("question_id").eq("application_id", application.id),
  ]);
  if (!requiredQuestions || !existingAnswers) fail(appPath(application.id), "questions");
  const answered = new Set(existingAnswers.map((answer) => answer.question_id));
  if (requiredQuestions.some((question) => !answered.has(question.id))) fail(appPath(application.id), "required-question");
  const { error } = await supabase.from("admission_applications").update({
    status: "submitted", visit_preference: visitPreference.data, assessment_preference: assessmentPreference.data,
    payment_preference: "pay_school_directly", declarations_accepted_at: new Date().toISOString(), consent_version: "admissions-parent-v1",
  }).eq("id", application.id).eq("parent_id", user.id);
  if (error) fail(appPath(application.id), "submit");
  if (visitPreference.data === "request_visit") {
    const { data: settings } = await supabase.from("school_admission_settings").select("visits_enabled").eq("school_id", application.school_id).maybeSingle();
    if (settings?.visits_enabled) {
      const { error: visitError } = await supabase.from("school_visits").insert({ application_id: application.id, school_id: application.school_id, parent_id: user.id, branch_id: application.branch_id, status: "requested" });
      if (visitError) fail(appPath(application.id), "visit");
    }
  }
  revalidatePath("/parent/applications");
  revalidatePath("/school/applications");
  redirect(`${appPath(application.id)}?saved=submitted`);
}

export async function registerAdmissionDocument(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, user, application, isParent } = await requireApplicationAccess(applicationId);
  if (!isParent || !["draft", "information_required"].includes(application.status)) return { ok: false as const, error: "This application no longer accepts document uploads." };
  const category = z.enum(["birth_certificate", "previous_school_report", "passport_photo", "transfer_document", "other"]).safeParse(formData.get("category"));
  const fileName = z.string().trim().min(1).max(180).safeParse(formData.get("fileName"));
  const mimeType = z.enum(["application/pdf", "image/jpeg", "image/png"]).safeParse(formData.get("mimeType"));
  const byteSize = Number(formData.get("byteSize"));
  const storagePath = z.string().max(255).safeParse(formData.get("storagePath"));
  if (!category.success || !fileName.success || !mimeType.success || !Number.isInteger(byteSize) || byteSize < 1 || byteSize > 20 * 1024 * 1024 || !storagePath.success) return { ok: false as const, error: "Check the document type and file details." };
  const expectedPrefix = `${user.id}/${application.id}/`;
  const expectedExtension = mimeType.data === "application/pdf" ? "pdf" : mimeType.data === "image/jpeg" ? "jpg" : "png";
  if (!storagePath.data.startsWith(expectedPrefix) || !new RegExp(`^${user.id}/${application.id}/[0-9a-f-]{36}\\.${expectedExtension}$`, "i").test(storagePath.data)) return { ok: false as const, error: "The uploaded file path is invalid." };
  const { error } = await supabase.from("admission_documents").insert({
    application_id: application.id, parent_id: user.id, category: category.data,
    file_name: fileName.data.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 180),
    storage_path: storagePath.data, mime_type: mimeType.data, byte_size: byteSize, uploaded_by: user.id,
  });
  if (error) return { ok: false as const, error: "The document could not be attached to this application." };
  revalidatePath(appPath(application.id));
  revalidatePath(schoolAppPath(application.id));
  return { ok: true };
}

export async function sendAdmissionMessage(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, user, application, isParent, isAdmissions } = await requireApplicationAccess(applicationId);
  const body = z.string().trim().min(1).max(4000).safeParse(formData.get("body"));
  const path = isParent ? appPath(application.id) : schoolAppPath(application.id);
  if (!body.success || (!isParent && !isAdmissions)) fail(path, "message");
  const { error } = await supabase.from("admission_messages").insert({
    application_id: application.id, school_id: application.school_id, parent_id: application.parent_id,
    sender_id: user.id, body: body.data,
  });
  if (error) fail(path, "message");
  revalidatePath(path);
  revalidatePath(isParent ? "/school/messages" : "/parent/messages");
  redirect(`${path}?saved=message`);
}

export async function markAdmissionMessageRead(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const messageId = idSchema.safeParse(formData.get("messageId"));
  const { supabase, user, application, isParent } = await requireApplicationAccess(applicationId);
  if (!messageId.success) fail(isParent ? appPath(application.id) : schoolAppPath(application.id), "message");
  const { data: exists } = await supabase.from("admission_message_reads").select("message_id").eq("message_id", messageId.data).eq("user_id", user.id).maybeSingle();
  if (!exists) await supabase.from("admission_message_reads").insert({ message_id: messageId.data, user_id: user.id });
  revalidatePath(isParent ? appPath(application.id) : schoolAppPath(application.id));
}

export async function cancelSchoolVisit(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const visitId = idSchema.safeParse(formData.get("visitId"));
  const { supabase, application, isParent } = await requireApplicationAccess(applicationId);
  if (!isParent || !visitId.success) fail(appPath(application.id), "visit");
  const { error } = await supabase.from("school_visits").update({ status: "cancelled" })
    .eq("id", visitId.data).eq("application_id", application.id).eq("parent_id", application.parent_id);
  if (error) fail(appPath(application.id), "visit");
  revalidatePath("/parent/visits");
  revalidatePath("/school/visits");
  redirect(`${appPath(application.id)}?saved=visit`);
}

export async function updateAdmissionStatus(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions) fail(schoolAppPath(application.id), "permission");
  const status = z.enum(applicationStatuses).safeParse(formData.get("status"));
  if (!status.success) fail(schoolAppPath(application.id), "status");
  const { error } = await supabase.from("admission_applications").update({ status: status.data }).eq("id", application.id);
  if (error) fail(schoolAppPath(application.id), "status");
  revalidatePath("/school/applications");
  revalidatePath("/parent/applications");
  redirect(`${schoolAppPath(application.id)}?saved=status`);
}

export async function requestInformation(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, user, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions) fail(schoolAppPath(application.id), "permission");
  const body = z.string().trim().min(8).max(4000).safeParse(formData.get("body"));
  if (!body.success) fail(schoolAppPath(application.id), "message");
  const { error: statusError } = await supabase.from("admission_applications").update({ status: "information_required" }).eq("id", application.id);
  if (statusError) fail(schoolAppPath(application.id), "status");
  const { error } = await supabase.from("admission_messages").insert({ application_id: application.id, school_id: application.school_id, parent_id: application.parent_id, sender_id: user.id, body: body.data });
  if (error) fail(schoolAppPath(application.id), "message");
  revalidatePath("/school/applications");
  revalidatePath("/parent/applications");
  redirect(`${schoolAppPath(application.id)}?saved=request`);
}

export async function requestSchoolVisit(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, user, application, isParent } = await requireApplicationAccess(applicationId);
  if (!isParent) fail(appPath(application.id), "permission");
  if (!["submitted", "received", "under_review", "information_required", "visit_required"].includes(application.status)) fail(appPath(application.id), "visit-stage");
  const { data: activeVisit } = await supabase.from("school_visits").select("id").eq("application_id", application.id).in("status", ["requested", "confirmed", "reschedule_proposed"]).limit(1).maybeSingle();
  if (activeVisit) fail(appPath(application.id), "visit-exists");
  const note = z.string().trim().max(1000).safeParse(formData.get("parentNote") || "");
  if (!note.success) fail(appPath(application.id), "visit");
  const { error } = await supabase.from("school_visits").insert({
    application_id: application.id, school_id: application.school_id, parent_id: user.id,
    branch_id: application.branch_id, status: "requested", parent_note: note.data || null,
  });
  if (error) fail(appPath(application.id), "visit");
  revalidatePath("/parent/visits");
  revalidatePath("/school/visits");
  redirect(`${appPath(application.id)}?saved=visit`);
}

export async function acceptVisitReschedule(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const visitId = idSchema.safeParse(formData.get("visitId"));
  const { supabase, application, isParent } = await requireApplicationAccess(applicationId);
  if (!isParent || !visitId.success) fail(appPath(application.id), "visit");
  const { data: visit } = await supabase.from("school_visits").select("proposed_at").eq("id", visitId.data).eq("application_id", application.id).eq("status", "reschedule_proposed").maybeSingle();
  if (!visit?.proposed_at || new Date(visit.proposed_at) <= new Date()) fail(appPath(application.id), "visit");
  const { error } = await supabase.from("school_visits").update({ status: "confirmed", scheduled_at: visit.proposed_at }).eq("id", visitId.data).eq("application_id", application.id);
  if (error) fail(appPath(application.id), "visit");
  revalidatePath("/parent/visits");
  revalidatePath("/school/visits");
  redirect(`${appPath(application.id)}?saved=visit`);
}

export async function updateSchoolVisit(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const visitId = idSchema.safeParse(formData.get("visitId"));
  const { supabase, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions || !visitId.success) fail(schoolAppPath(application.id), "visit");
  const status = z.enum(visitStatuses).safeParse(formData.get("status"));
  const dateText = String(formData.get("scheduledAt") ?? "");
  const visitDate = dateText ? new Date(dateText) : null;
  const instructions = z.string().trim().max(2000).safeParse(formData.get("instructions") || "");
  if (!status.success || !instructions.success || (status.data !== "cancelled" && status.data !== "completed" && status.data !== "no_show" && (!visitDate || !Number.isFinite(visitDate.getTime()) || visitDate <= new Date()))) fail(schoolAppPath(application.id), "visit");
  const patch = {
    status: status.data,
    scheduled_at: status.data === "confirmed" ? visitDate?.toISOString() : undefined,
    proposed_at: status.data === "reschedule_proposed" ? visitDate?.toISOString() : null,
    instructions: instructions.data || null,
  };
  const { error } = await supabase.from("school_visits").update(patch).eq("id", visitId.data).eq("application_id", application.id);
  if (error) fail(schoolAppPath(application.id), "visit");
  revalidatePath("/school/visits");
  revalidatePath("/parent/visits");
  redirect(`${schoolAppPath(application.id)}?saved=visit`);
}

export async function scheduleSchoolAssessment(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, user, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions) fail(schoolAppPath(application.id), "permission");
  const type = z.enum(["assessment", "interview"]).safeParse(formData.get("assessmentType"));
  const date = new Date(String(formData.get("scheduledAt") ?? ""));
  const location = z.string().trim().max(300).safeParse(formData.get("location") || "");
  const instructions = z.string().trim().max(2000).safeParse(formData.get("instructions") || "");
  if (!type.success || !location.success || !instructions.success || !Number.isFinite(date.getTime()) || date <= new Date()) fail(schoolAppPath(application.id), "assessment");
  const requiredStatus = type.data === "assessment" ? "assessment_required" : "interview_required";
  const scheduledStatus = type.data === "assessment" ? "assessment_scheduled" : "interview_scheduled";
  const { data: config } = await supabase.from("school_admission_settings").select("assessments_enabled, interviews_enabled").eq("school_id", application.school_id).maybeSingle();
  if (!config || (type.data === "assessment" ? !config.assessments_enabled : !config.interviews_enabled)) fail(schoolAppPath(application.id), "assessment-disabled");
  if (!["submitted", "received", "under_review", "information_required", requiredStatus].includes(application.status)) fail(schoolAppPath(application.id), "assessment-stage");
  if (application.status !== requiredStatus) {
    const { error } = await supabase.from("admission_applications").update({ status: requiredStatus }).eq("id", application.id);
    if (error) fail(schoolAppPath(application.id), "status");
  }
  const { error: assessmentError } = await supabase.from("school_assessments").insert({
    application_id: application.id, school_id: application.school_id, parent_id: application.parent_id,
    assessment_type: type.data, status: "scheduled", scheduled_at: date.toISOString(),
    location: location.data || null, instructions: instructions.data || null, parent_visible: true, created_by: user.id,
  });
  if (assessmentError) fail(schoolAppPath(application.id), "assessment");
  const { error } = await supabase.from("admission_applications").update({ status: scheduledStatus }).eq("id", application.id);
  if (error) fail(schoolAppPath(application.id), "status");
  revalidatePath("/school/visits");
  revalidatePath("/parent/visits");
  revalidatePath("/parent/applications");
  redirect(`${schoolAppPath(application.id)}?saved=assessment`);
}

export async function updateSchoolAssessment(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const assessmentId = idSchema.safeParse(formData.get("assessmentId"));
  const { supabase, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions || !assessmentId.success) fail(schoolAppPath(application.id), "assessment");
  const status = z.enum(["scheduled", "rescheduled", "completed", "cancelled", "no_show"]).safeParse(formData.get("status"));
  const scheduled = new Date(String(formData.get("scheduledAt") ?? ""));
  const location = z.string().trim().max(300).safeParse(formData.get("location") || "");
  const instructions = z.string().trim().max(2000).safeParse(formData.get("instructions") || "");
  if (!status.success || !location.success || !instructions.success
    || (["scheduled", "rescheduled"].includes(status.data) && (!Number.isFinite(scheduled.getTime()) || scheduled <= new Date()))) fail(schoolAppPath(application.id), "assessment");
  const patch = {
    status: status.data,
    scheduled_at: ["scheduled", "rescheduled"].includes(status.data) ? scheduled.toISOString() : undefined,
    location: location.data || null,
    instructions: instructions.data || null,
  };
  const { error } = await supabase.from("school_assessments").update(patch).eq("id", assessmentId.data).eq("application_id", application.id);
  if (error) fail(schoolAppPath(application.id), "assessment");
  revalidatePath("/school/visits");
  revalidatePath("/parent/visits");
  revalidatePath(appPath(application.id));
  redirect(`${schoolAppPath(application.id)}?saved=assessment`);
}

export async function createAdmissionOffer(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, user, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions) fail(schoolAppPath(application.id), "permission");
  const expiresText = String(formData.get("expiresAt") ?? "");
  const expiresAt = expiresText ? new Date(expiresText) : null;
  const conditions = z.string().trim().max(4000).safeParse(formData.get("conditions") || "");
  const requiredDocs = z.string().max(2000).safeParse(formData.get("requiredDocuments") || "");
  const nextSteps = z.string().trim().max(2000).safeParse(formData.get("nextSteps") || "");
  if (!conditions.success || !requiredDocs.success || !nextSteps.success || (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()))) fail(schoolAppPath(application.id), "offer");
  if (application.status !== "decision_pending") {
    const { error } = await supabase.from("admission_applications").update({ status: "decision_pending" }).eq("id", application.id);
    if (error) fail(schoolAppPath(application.id), "status");
  }
  const { data: previous } = await supabase.from("admission_offers").select("offer_version").eq("application_id", application.id).order("offer_version", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("admission_offers").insert({
    application_id: application.id, school_id: application.school_id, parent_id: application.parent_id,
    branch_id: application.branch_id, class_name: application.class_name,
    academic_year: application.academic_year, term: application.term,
    offer_version: (previous?.offer_version ?? 0) + 1, status: "issued", issued_at: new Date().toISOString(),
    expires_at: expiresAt?.toISOString() ?? null, conditions: conditions.data || null,
    required_documents: requiredDocs.data.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20),
    next_steps: nextSteps.data || null, created_by: user.id,
  });
  if (error) fail(schoolAppPath(application.id), "offer");
  revalidatePath("/school/applications");
  revalidatePath("/parent/applications");
  redirect(`${schoolAppPath(application.id)}?saved=offer`);
}

export async function decideAdmissionOffer(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const offerId = idSchema.safeParse(formData.get("offerId"));
  const decision = z.enum(["accepted", "declined"]).safeParse(formData.get("decision"));
  const { supabase, application, isParent } = await requireApplicationAccess(applicationId);
  if (!isParent || !offerId.success || !decision.success) fail(appPath(application.id), "offer");
  const { error } = await supabase.from("admission_offers").update({ status: decision.data, decision_at: new Date().toISOString() })
    .eq("id", offerId.data).eq("application_id", application.id).eq("status", "issued");
  if (error) fail(appPath(application.id), "offer");
  revalidatePath("/school/applications");
  revalidatePath("/parent/applications");
  redirect(`${appPath(application.id)}?saved=offer-decision`);
}

function nairaToKobo(value: string): string | null {
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  // The input is bounded to 12 whole digits, so integer arithmetic remains
  // within Number.MAX_SAFE_INTEGER after conversion to kobo.
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0") || "0");
  const kobo = whole * 100 + fraction;
  return Number.isSafeInteger(kobo) && kobo > 0 ? String(kobo) : null;
}

export async function createSchoolInvoice(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const { supabase, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions) fail(schoolAppPath(application.id), "permission");
  const categories = formData.getAll("feeCategory").map(String);
  const descriptions = formData.getAll("feeDescription").map(String);
  const quantities = formData.getAll("feeQuantity").map(String);
  const amounts = formData.getAll("feeAmount").map(String);
  const items: Array<{ category: string; description: string; quantity: number; unit_amount_minor: string } | { invalid: true }> = categories.reduce<Array<{ category: string; description: string; quantity: number; unit_amount_minor: string } | { invalid: true }>>((result, category, index) => {
    const description = descriptions[index]?.trim() ?? "";
    const quantity = Number(quantities[index] ?? "1");
    const unitAmountMinor = nairaToKobo(amounts[index] ?? "");
    if (!description && !amounts[index]?.trim()) return result;
    if (!description || !unitAmountMinor || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return [...result, { invalid: true }];
    return [...result, { category, description, quantity, unit_amount_minor: unitAmountMinor }];
  }, []);
  if (!items.length || items.some((item) => "invalid" in item)) fail(schoolAppPath(application.id), "invoice-lines");
  const year = z.string().regex(/^\d{4}\/\d{4}$/).safeParse(formData.get("academicYear"));
  const term = z.string().trim().min(2).max(80).safeParse(formData.get("term"));
  const due = String(formData.get("dueDate") ?? "");
  const dueDate = due ? z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(due) : null;
  if (!year.success || !term.success || (dueDate && !dueDate.success)) fail(schoolAppPath(application.id), "invoice");
  const { data: invoiceId, error } = await supabase.rpc("create_admission_invoice", {
    target_application_id: application.id,
    target_academic_year: year.data,
    target_term: term.data,
    target_due_date: dueDate?.success ? dueDate.data : null,
    target_items: items,
  });
  if (error || !invoiceId) fail(schoolAppPath(application.id), "invoice");
  revalidatePath("/school/applications");
  revalidatePath("/parent/applications");
  redirect(`${schoolAppPath(application.id)}?saved=invoice`);
}

export async function changeInvoiceStatus(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const invoiceId = idSchema.safeParse(formData.get("invoiceId"));
  const status = z.enum(["issued", "confirmed", "cancelled"]).safeParse(formData.get("status"));
  const { supabase, application, isAdmissions } = await requireApplicationAccess(applicationId);
  if (!isAdmissions || !invoiceId.success || !status.success) fail(schoolAppPath(application.id), "invoice");
  const { error } = await supabase.from("school_invoices").update({ status: status.data }).eq("id", invoiceId.data).eq("application_id", application.id);
  if (error) fail(schoolAppPath(application.id), "invoice");
  revalidatePath("/school/applications");
  revalidatePath("/parent/applications");
  redirect(`${schoolAppPath(application.id)}?saved=invoice`);
}

export async function saveAdmissionSettings(formData: FormData) {
  const { supabase, user, schoolId } = await requireSchoolAdmissions(formData);
  const applicationsEnabled = formData.get("applicationsEnabled") === "on";
  const visitsEnabled = formData.get("visitsEnabled") === "on";
  const assessmentsEnabled = formData.get("assessmentsEnabled") === "on";
  const interviewsEnabled = formData.get("interviewsEnabled") === "on";
  const yearText = String(formData.get("academicYear") ?? "").trim();
  const academicYear = yearText ? z.string().regex(/^\d{4}\/\d{4}$/).safeParse(yearText) : { success: true as const, data: null };
  const termText = String(formData.get("term") ?? "").trim();
  const term = termText ? z.string().trim().min(2).max(80).safeParse(termText) : { success: true as const, data: null };
  const instructions = z.string().trim().max(4000).safeParse(formData.get("instructions") || "");
  const parseDate = (value: FormDataEntryValue | null) => {
    const text = String(value ?? "").trim();
    if (!text) return { success: true as const, data: null };
    const date = new Date(text);
    return Number.isFinite(date.getTime()) ? { success: true as const, data: date.toISOString() } : { success: false as const };
  };
  const opensAt = parseDate(formData.get("opensAt"));
  const closesAt = parseDate(formData.get("closesAt"));
  if (!academicYear.success || !term.success || !instructions.success || !opensAt.success || !closesAt.success
    || (applicationsEnabled && (!academicYear.data || !term.data))
    || (opensAt.data && closesAt.data && new Date(closesAt.data) <= new Date(opensAt.data))) fail("/school/admissions/settings", "details");
  const { error } = await supabase.from("school_admission_settings").upsert({
    school_id: schoolId, applications_enabled: applicationsEnabled,
    academic_year: academicYear.data, term: term.data, opens_at: opensAt.data, closes_at: closesAt.data,
    instructions: instructions.data || null, visits_enabled: visitsEnabled,
    assessments_enabled: assessmentsEnabled, interviews_enabled: interviewsEnabled, updated_by: user.id,
  }, { onConflict: "school_id" });
  if (error) fail("/school/admissions/settings", "save");
  revalidatePath("/school/admissions");
  revalidatePath("/school/admissions/settings");
  revalidatePath("/schools");
  redirect("/school/admissions/settings?saved=settings");
}

export async function savePrivateAdmissionSettings(formData: FormData) {
  const { supabase, user, schoolId } = await requireSchoolAdmissions(formData);
  const contact = z.string().trim().max(160).safeParse(formData.get("admissionsContactPerson") || "");
  const emailText = String(formData.get("internalNotificationEmail") ?? "").trim();
  const email = emailText ? z.string().email().max(254).safeParse(emailText) : { success: true as const, data: "" };
  if (!contact.success || !email.success) fail("/school/admissions/settings", "private-contact");
  const { error } = await supabase.from("school_admission_private_settings").upsert({
    school_id: schoolId, admissions_contact_person: contact.data || null,
    internal_notification_email: email.data || null,
    notify_new_applications: formData.get("notifyNewApplications") === "on",
    notify_parent_replies: formData.get("notifyParentReplies") === "on",
    updated_by: user.id,
  }, { onConflict: "school_id" });
  if (error) fail("/school/admissions/settings", "private-contact");
  revalidatePath("/school/admissions/settings");
  redirect("/school/admissions/settings?saved=private-contact");
}

export async function updateSchoolAdmissionsStatus(formData: FormData) {
  const { supabase, schoolId } = await requireSchoolAdmissions(formData);
  const status = z.enum(["open", "closed", "opening_soon"]).safeParse(formData.get("admissionStatus"));
  if (!status.success) fail("/school/admissions/settings", "status");
  const { error } = await supabase.rpc("update_school_admission_status", { target_school_id: schoolId, target_status: status.data });
  if (error) fail("/school/admissions/settings", "status");
  revalidatePath("/school/admissions");
  revalidatePath("/school/admissions/settings");
  revalidatePath("/schools");
  redirect("/school/admissions/settings?saved=status");
}

export async function updateAdmissionClassAvailability(formData: FormData) {
  const { supabase } = await requireSchoolAdmissions(formData);
  const classId = idSchema.safeParse(formData.get("classId"));
  const accepting = formData.get("accepting") === "true";
  if (!classId.success) fail("/school/admissions/settings", "class");
  const { error } = await supabase.rpc("update_admission_class_availability", { target_class_id: classId.data, accepting });
  if (error) fail("/school/admissions/settings", "class");
  revalidatePath("/school/admissions/settings");
  revalidatePath("/school/applications");
  revalidatePath("/schools");
  redirect("/school/admissions/settings?saved=class");
}

export async function addAdmissionQuestion(formData: FormData) {
  const { supabase, schoolId } = await requireSchoolAdmissions(formData);
  const prompt = z.string().trim().min(2).max(500).safeParse(formData.get("prompt"));
  const answerType = z.enum(["short_text", "long_text", "yes_no", "select"]).safeParse(formData.get("answerType"));
  const options = z.string().max(1500).safeParse(formData.get("options") || "");
  if (!prompt.success || !answerType.success || !options.success) fail("/school/admissions/settings", "question");
  const optionList = options.data.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 12);
  if (answerType.data === "select" && optionList.length < 2) fail("/school/admissions/settings", "options");
  const { count } = await supabase.from("school_application_questions").select("id", { count: "exact", head: true }).eq("school_id", schoolId);
  const { error } = await supabase.from("school_application_questions").insert({
    school_id: schoolId, prompt: prompt.data, answer_type: answerType.data,
    options: answerType.data === "select" ? optionList : [],
    is_required: formData.get("isRequired") === "on", sort_order: count ?? 0,
  });
  if (error) fail("/school/admissions/settings", "question");
  revalidatePath("/school/admissions/settings");
  redirect("/school/admissions/settings?saved=question");
}

export async function deactivateAdmissionQuestion(formData: FormData) {
  const { supabase, schoolId } = await requireSchoolAdmissions(formData);
  const questionId = idSchema.safeParse(formData.get("questionId"));
  if (!questionId.success) fail("/school/admissions/settings", "question");
  const { error } = await supabase.from("school_application_questions").update({ is_active: false }).eq("school_id", schoolId).eq("id", questionId.data);
  if (error) fail("/school/admissions/settings", "question");
  revalidatePath("/school/admissions/settings");
  redirect("/school/admissions/settings?saved=question");
}
