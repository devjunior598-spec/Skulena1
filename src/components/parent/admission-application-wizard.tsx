"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdmissionApplication } from "@/app/admissions/actions";
import { submitDraftApplication } from "@/app/admissions/actions";
import { AdmissionDocumentUploader } from "@/components/parent/admission-document-uploader";

type ChildOption = { id: string; first_name: string; last_name: string; date_of_birth: string | null };
type ClassOption = { id: string; name: string; branch_id: string | null };
type Question = { id: string; prompt: string; answer_type: string; options: unknown; is_required: boolean };

const steps = ["Child & class", "Guardian", "Education", "Questions", "Documents", "Visit", "Payment", "Review & consent"];
const field = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15";

export function AdmissionApplicationWizard({
  action, schoolId, schoolSlug, schoolName, academicYear, term, instructions, childOptions, classes, questions, guardianName, guardianEmail,
}: {
  action: typeof createAdmissionApplication; schoolId: string; schoolSlug: string; schoolName: string;
  academicYear: string; term: string; instructions: string | null;
  childOptions: ChildOption[]; classes: ClassOption[]; questions: Question[]; guardianName: string; guardianEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [classId, setClassId] = useState("");
  const [draftId, setDraftId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [review, setReview] = useState<{ child: string; className: string; guardian: string; email: string; previousSchool: string; previousClass: string; visit: string; assessment: string } | null>(null);
  const activeClass = classes.find((item) => item.id === classId);

  function captureReview() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const child = childOptions.find((item) => item.id === data.get("childId"));
    const selectedClass = classes.find((item) => item.id === data.get("classId"));
    setReview({
      child: child ? `${child.first_name} ${child.last_name}` : "Not selected",
      className: selectedClass?.name ?? "Not selected",
      guardian: String(data.get("guardianName") ?? ""),
      email: String(data.get("guardianEmail") ?? ""),
      previousSchool: String(data.get("previousSchool") ?? "") || "Not provided",
      previousClass: String(data.get("previousClass") ?? "") || "Not provided",
      visit: String(data.get("visitPreference") ?? "no_visit").replaceAll("_", " "),
      assessment: String(data.get("assessmentPreference") ?? "no_preference").replaceAll("_", " "),
    });
  }

  function validateStep(index: number) {
    const fieldset = formRef.current?.querySelector<HTMLElement>(`[data-step="${index}"]`);
    const requiredFields = Array.from(fieldset?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-required='true']") ?? []);
    const invalid = requiredFields.find((control) => {
      if (control instanceof HTMLInputElement && control.type === "checkbox") return !control.checked;
      return !control.value.trim() || !control.checkValidity();
    });
    if (invalid) { invalid.reportValidity(); return false; }
    return true;
  }

  async function saveDraft() {
    if (!formRef.current || saving) return null;
    setSaving(true);
    setSaveError("");
    try {
      const data = new FormData(formRef.current);
      data.set("intent", "draft");
      data.set("schoolId", schoolId);
      data.set("schoolSlug", schoolSlug);
      data.set("applicationId", draftId);
      const result = await action(data);
      setDraftId(result.applicationId);
      return result.applicationId;
    } catch {
      setSaveError("We couldn’t save this draft. Your information is still on this page; please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter as HTMLButtonElement | null : null;
    if (submitter?.value === "draft") {
      const applicationId = await saveDraft();
      if (applicationId) router.push(`/parent/applications/${applicationId}?saved=draft`);
      return;
    }
    for (let index = 0; index < steps.length; index += 1) {
      if (!validateStep(index)) { setStep(index); return; }
    }
    const applicationId = await saveDraft();
    if (!applicationId || !formRef.current) return;
    const current = new FormData(formRef.current);
    const submitData = new FormData();
    submitData.set("applicationId", applicationId);
    submitData.set("consentAccepted", formRef.current.querySelector<HTMLInputElement>("[name='consentAccepted']")?.checked ? "on" : "");
    submitData.set("visitPreference", String(current.get("visitPreference") ?? "no_visit"));
    submitData.set("assessmentPreference", String(current.get("assessmentPreference") ?? "no_preference"));
    await submitDraftApplication(submitData);
  }

  async function continueStep() {
    if (!validateStep(step)) return;
    captureReview();
    if (step === 3) {
      const applicationId = await saveDraft();
      if (!applicationId) return;
      setStep(4);
    } else setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  return <form ref={formRef} onSubmit={onSubmit} className="mt-6 space-y-5">
    <input type="hidden" name="schoolId" value={schoolId} />
    <input type="hidden" name="schoolSlug" value={schoolSlug} />
    <input type="hidden" name="applicationId" value={draftId} />
    <input type="hidden" name="branchId" value={activeClass?.branch_id ?? ""} />
    <input type="hidden" name="academicYear" value={academicYear} />
    <input type="hidden" name="term" value={term} />
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Application steps">
      {steps.map((label, index) => <li key={label}><button type="button" onClick={() => index <= step && setStep(index)} aria-current={step === index ? "step" : undefined} className={`min-h-10 w-full rounded-xl px-2 text-left text-[11px] font-bold ${step === index ? "bg-emerald-800 text-white" : index < step ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-500"}`}><span className="mr-1.5">{index + 1}.</span>{label}</button></li>)}
    </ol>

    <fieldset data-step="0" hidden={step !== 0} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">Child and class</legend><h2 className="text-lg font-extrabold text-[#0e2946]">Who is applying?</h2>
      <label className="block text-sm font-bold text-slate-700">Child <select className={field} name="childId" data-required="true" required={step === 0} defaultValue=""><option value="" disabled>Select a child profile</option>{childOptions.map((child) => <option key={child.id} value={child.id}>{child.first_name} {child.last_name}</option>)}</select></label>
      <label className="block text-sm font-bold text-slate-700">Class <select className={field} name="classId" data-required="true" required={step === 0} value={classId} onChange={(event) => setClassId(event.target.value)}><option value="" disabled>Select an available class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <p className="text-xs text-slate-500">Intake: {academicYear} · {term}</p>
    </fieldset>

    <fieldset data-step="1" hidden={step !== 1} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">Parent or guardian</legend><h2 className="text-lg font-extrabold text-[#0e2946]">Parent or guardian</h2>
      <label className="block text-sm font-bold text-slate-700">Full name<input className={field} name="guardianName" defaultValue={guardianName} minLength={2} maxLength={160} data-required="true" required={step === 1} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-700">Email<input className={field} type="email" name="guardianEmail" defaultValue={guardianEmail} maxLength={254} data-required="true" required={step === 1} /></label><label className="block text-sm font-bold text-slate-700">Phone (optional)<input className={field} type="tel" name="guardianPhone" maxLength={30} autoComplete="tel" /></label></div>
      <label className="block text-sm font-bold text-slate-700">Relationship to child (optional)<input className={field} name="relationship" maxLength={80} placeholder="Parent, guardian…" /></label>
    </fieldset>

    <fieldset data-step="2" hidden={step !== 2} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">Previous education</legend><h2 className="text-lg font-extrabold text-[#0e2946]">Previous education</h2>
      <label className="block text-sm font-bold text-slate-700">Previous school (optional)<input className={field} name="previousSchool" maxLength={200} /></label>
      <label className="block text-sm font-bold text-slate-700">Previous class or level (optional)<input className={field} name="previousClass" maxLength={120} /></label>
      <p className="text-xs leading-5 text-slate-500">Only share information relevant to this application. Don’t enter bank details, NIN or BVN here.</p>
    </fieldset>

    <fieldset data-step="3" hidden={step !== 3} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">School questions</legend><h2 className="text-lg font-extrabold text-[#0e2946]">Questions from {schoolName}</h2>
      {questions.length ? questions.map((question) => <label key={question.id} className="block text-sm font-bold text-slate-700">{question.prompt}{question.is_required ? " *" : " (optional)"}
        {question.answer_type === "yes_no" ? <select className={field} name={`question_${question.id}`} data-required={question.is_required ? "true" : undefined} required={step === 3 && question.is_required} defaultValue=""><option value="">Choose…</option><option value="yes">Yes</option><option value="no">No</option></select>
          : question.answer_type === "select" ? <select className={field} name={`question_${question.id}`} data-required={question.is_required ? "true" : undefined} required={step === 3 && question.is_required} defaultValue=""><option value="">Choose…</option>{(Array.isArray(question.options) ? question.options : []).map((value) => <option key={String(value)} value={String(value)}>{String(value)}</option>)}</select>
            : question.answer_type === "long_text" ? <textarea className={`${field} py-3`} rows={4} maxLength={5000} name={`question_${question.id}`} data-required={question.is_required ? "true" : undefined} required={step === 3 && question.is_required} />
              : <input className={field} maxLength={1000} name={`question_${question.id}`} data-required={question.is_required ? "true" : undefined} required={step === 3 && question.is_required} />}</label>) : <p className="text-sm text-slate-600">The school has not added any extra questions.</p>}
    </fieldset>

    <fieldset data-step="4" hidden={step !== 4} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">Documents</legend><h2 className="text-lg font-extrabold text-[#0e2946]">Admission documents</h2><p className="text-sm leading-6 text-slate-600">Upload the documents requested by the school. Files go directly to private storage and are attached to your saved application.</p>
      {draftId ? <AdmissionDocumentUploader applicationId={draftId} /> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Save your application details first to enable secure document upload.</p>}
    </fieldset>

    <fieldset data-step="5" hidden={step !== 5} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">Visit preference</legend><h2 className="text-lg font-extrabold text-[#0e2946]">Visit and assessment preferences</h2>
      <label className="block text-sm font-bold text-slate-700">Would you like to request a visit?<select className={field} name="visitPreference" defaultValue="no_visit"><option value="no_visit">Not now</option><option value="request_visit">Yes, request a visit</option></select></label>
      <label className="block text-sm font-bold text-slate-700">Assessment preference<select className={field} name="assessmentPreference" defaultValue="no_preference"><option value="no_preference">No preference</option><option value="in_person">In person</option><option value="online">Online, if available</option></select></label>
    </fieldset>

    <fieldset data-step="6" hidden={step !== 6} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">Payment preference</legend><h2 className="text-lg font-extrabold text-[#0e2946]">School fee payment preference</h2>
      <label className="block text-sm font-bold text-slate-700">School fee payment preference<select className={field} name="paymentPreference" defaultValue="pay_school_directly"><option value="pay_school_directly">Pay the school directly</option><option value="schoolpay_interest" disabled>Interested in SchoolPay — not available yet</option></select></label>
      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">SchoolPay applications, identity checks, financing and payments are not configured. No financing or payment is being requested here.</p>
    </fieldset>

    <fieldset data-step="7" hidden={step !== 7} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="sr-only">Review and consent</legend><h2 className="text-lg font-extrabold text-[#0e2946]">Review and submit</h2>
      {review && <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">{[["Child", review.child], ["Class", review.className], ["Parent / guardian", review.guardian], ["Email", review.email], ["Previous school", review.previousSchool], ["Previous class", review.previousClass], ["Visit preference", review.visit], ["Assessment preference", review.assessment]].map(([label, value]) => <div key={label}><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-800">{value}</dd></div>)}</dl>}
      {instructions && <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>From the school</strong><p className="mt-1 whitespace-pre-line">{instructions}</p></div>}
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700"><input type="checkbox" name="consentAccepted" className="mt-1 size-4 accent-emerald-700" data-required="true" required={step === 7} /><span>I confirm that the information I submitted is accurate and consent to sharing this application and its admission documents with {schoolName} for this admissions process.</span></label>
      <p className="text-xs leading-5 text-slate-500">A draft remains private to you. After submission, the school’s authorized admissions team can review it. Your child profile is not made public.</p>
    </fieldset>

    {saveError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{saveError}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={step === 0 || saving} onClick={() => setStep((current) => Math.max(0, current - 1))} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 disabled:opacity-40">Back</button>
      <div className="flex flex-wrap gap-2"><button type="submit" name="intent" value="draft" formNoValidate disabled={saving} className="min-h-11 rounded-xl border border-emerald-700 px-4 text-sm font-bold text-emerald-800 disabled:opacity-50">{saving ? "Saving…" : "Save draft"}</button>{step < steps.length - 1 ? <button type="button" disabled={saving} onClick={continueStep} className="min-h-11 rounded-xl bg-emerald-800 px-5 text-sm font-extrabold text-white hover:bg-emerald-900 disabled:opacity-50">{saving ? "Saving…" : "Continue"}</button> : <button type="submit" name="intent" value="submit" disabled={saving} className="min-h-11 rounded-xl bg-emerald-800 px-5 text-sm font-extrabold text-white disabled:opacity-50">{saving ? "Saving…" : "Submit application"}</button>}</div>
    </div>
  </form>;
}
