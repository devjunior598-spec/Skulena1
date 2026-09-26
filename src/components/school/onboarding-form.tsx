"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Cloud, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onboardingSchema, type OnboardingValues } from "@/lib/validation/school";
import { getSchoolSubmissionRequirements, saveOnboardingStep, submitSchool, type SubmissionRequirement } from "@/app/for-schools/register/actions";
import { MediaUploader } from "@/components/school/media-uploader";

const steps = ["Basic information", "Location", "Levels", "Structure", "Curriculum", "Facilities", "Fees", "Photos & videos", "Admissions", "Review"];
const levelOptions = [["creche", "Creche"], ["nursery", "Nursery"], ["primary", "Primary"], ["junior_secondary", "Junior Secondary"], ["senior_secondary", "Senior Secondary"]] as const;
const curriculumOptions = [["nigerian", "Nigerian"], ["british", "British"], ["american", "American"], ["montessori", "Montessori"], ["cambridge", "Cambridge"], ["ib", "IB"], ["other", "Other"]] as const;
const facilityOptions = [["classrooms", "Classrooms"], ["science_laboratory", "Science Laboratory"], ["ict_laboratory", "ICT Laboratory"], ["library", "Library"], ["playground", "Playground"], ["sports", "Sports Facilities"], ["school_bus", "School Bus"], ["dining", "Dining"], ["kitchen", "Kitchen"], ["sick_bay", "Sick Bay"], ["toilets", "Toilets"], ["boarding", "Boarding"], ["security", "Security"], ["special_needs", "Special Needs Facilities"], ["other", "Other"]] as const;
const input = "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[#0e2946] focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10";
const textarea = "mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-[#0e2946] focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10";

function isStepComplete(step: number, values: OnboardingValues) {
  if (step === 1) return Boolean(values.name.trim() && values.slug.trim() && values.description.trim());
  if (step === 2) return Boolean(values.addressLine.trim());
  if (step === 3) return values.levels.length > 0;
  if (step === 4) return Boolean(values.structure && values.gender);
  if (step === 5) return values.curricula.length > 0;
  if (step === 6) return values.facilities.length > 0;
  if (step === 7) return values.feeAmount !== "" && Boolean(values.academicYear.trim());
  if (step === 9) return Boolean(values.admissionStatus);
  return false;
}

function CheckGrid({ name, options, register }: { name: "levels" | "curricula" | "facilities"; options: readonly (readonly [string, string])[]; register: ReturnType<typeof useForm<OnboardingValues>>["register"] }) {
  return <div className="grid gap-3 sm:grid-cols-2">{options.map(([value, label]) => <label key={value} className="flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"><input type="checkbox" value={value} {...register(name)} className="size-4 accent-emerald-700" /><span className="text-sm font-bold text-slate-700">{label}</span></label>)}</div>;
}

function ProgressSidebar({ currentStep, completion, completedSteps, locked, onNavigate }: { currentStep: number; completion: number; completedSteps: number[]; locked: boolean; onNavigate: (step: number) => void }) {
  return <aside aria-label="Profile setup progress">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-slate-600">Profile completion</p>
        <span className="text-lg font-extrabold leading-none text-[#0e2946]">{completion}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}>
        <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${completion}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500">{completedSteps.length} of {steps.length} steps completed</p>
      <ol className="mt-3 hidden space-y-1 lg:block">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCurrent = currentStep === stepNumber;
          const isComplete = !isCurrent && completedSteps.includes(stepNumber);
          const state = isCurrent ? "Current step" : isComplete ? "Completed" : "Upcoming";
          return <li key={label}>
            <button type="button" aria-current={isCurrent ? "step" : undefined} aria-label={`${label}, ${state.toLowerCase()}`} disabled={locked && !isCurrent} onClick={() => onNavigate(stepNumber)} className={`flex min-h-8 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isCurrent ? "bg-emerald-50 text-[#0e2946] ring-1 ring-inset ring-emerald-200" : isComplete ? "text-emerald-900 hover:bg-emerald-50/80" : "text-slate-500 hover:bg-slate-50"}`}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${isCurrent ? "bg-emerald-700 text-white" : isComplete ? "bg-emerald-100 text-emerald-800" : "border border-slate-200 bg-white text-slate-400"}`}>{isComplete ? <Check className="size-3" aria-hidden="true" /> : stepNumber}</span>
              <span className={`min-w-0 flex-1 truncate text-[11px] leading-4 ${isCurrent ? "font-extrabold" : "font-semibold"}`}>{label}</span>
              {isCurrent && <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wide text-emerald-800">Now</span>}
            </button>
          </li>;
        })}
      </ol>
    </div>
  </aside>;
}

export function OnboardingForm({ initialValues, initialCompletion, initialCompletedSteps }: { initialValues: OnboardingValues; initialCompletion: number; initialCompletedSteps: number[] }) {
  const [step, setStep] = useState(initialValues.step || 1); const [schoolId, setSchoolId] = useState(initialValues.schoolId); const [completion, setCompletion] = useState(initialCompletion); const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "submitted">("idle"); const [message, setMessage] = useState(""); const [pendingMediaCount, setPendingMediaCount] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>(initialCompletedSteps);
  const [submissionRequirements, setSubmissionRequirements] = useState<SubmissionRequirement[] | null>(null);
  const [submissionCheckError, setSubmissionCheckError] = useState("");
  const { control, register, getValues, setValue, formState: { errors } } = useForm<OnboardingValues>({ defaultValues: initialValues });
  const watchedValues = useWatch({ control });
  const hasUnuploadedMedia = step === 8 && pendingMediaCount > 0;
  const checkingSubmission = step === 10 && Boolean(schoolId) && submissionRequirements === null && !submissionCheckError;
  const values: OnboardingValues = {
    ...initialValues,
    ...watchedValues,
    levels: watchedValues.levels ?? [],
    curricula: watchedValues.curricula ?? [],
    facilities: watchedValues.facilities ?? [],
    admissionStatus: watchedValues.admissionStatus ?? "closed",
  };
  useEffect(() => {
    if (step !== 10 || !schoolId) return;
    let active = true;
    void getSchoolSubmissionRequirements(schoolId).then((result) => {
      if (!active) return;
      if ("error" in result) setSubmissionCheckError(result.error ?? "We couldn’t check the submission requirements. Please try again.");
      else setSubmissionRequirements(result.requirements);
    }).catch(() => {
      if (active) setSubmissionCheckError("We couldn’t check the submission requirements. Please try again.");
    });
    return () => { active = false; };
  }, [schoolId, step]);
  function navigateToStep(nextStep: number) {
    if (nextStep === 10 && step !== 10) {
      setSubmissionRequirements(null);
      setSubmissionCheckError("");
    }
    setStep(nextStep);
  }
  async function saveCurrent(next = true) {
    setStatus("saving"); setMessage("");
    const parsed = onboardingSchema.safeParse({ ...getValues(), schoolId, step });
    if (!parsed.success) { setStatus("error"); setMessage(parsed.error.issues[0]?.message ?? "Check this step."); return; }
    const result = await saveOnboardingStep(parsed.data);
    if (result.schoolId) { setSchoolId(result.schoolId); setValue("schoolId", result.schoolId); }
    if (result.error) { setStatus("error"); setMessage(result.error); return; }
    setCompletion(result.completion ?? completion); setStatus("saved"); if (next) { setCompletedSteps((current) => { if (step === 8) return current; const complete = isStepComplete(step, parsed.data); return complete ? current.includes(step) ? current : [...current, step] : current.filter((savedStep) => savedStep !== step); }); navigateToStep(Math.min(10, step + 1)); }
  }
  async function submit() {
    if (!schoolId) { setMessage("Save the first step before submitting."); return; }
    setStatus("saving"); const result = await submitSchool(schoolId); if (result.error) { setStatus("error"); setMessage(result.error); if (result.requirements) setSubmissionRequirements(result.requirements); } else setStatus("submitted");
  }
  if (status === "submitted") return <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-7" /></span><h1 className="mt-5 text-3xl font-extrabold text-[#0e2946]">Profile submitted</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">Your school is now under review. Submission does not publish the profile or award a verification badge.</p><Button asChild className="mt-6"><Link href="/school/dashboard">Go to dashboard</Link></Button></div>;
  return <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]"><ProgressSidebar currentStep={step} completion={completion} completedSteps={completedSteps} locked={hasUnuploadedMedia} onNavigate={navigateToStep} />
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-45px_rgba(14,41,70,.45)] sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Step {step} of 10</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0e2946]">{steps[step - 1]}</h1></div><p aria-live="polite" className="flex items-center gap-2 text-xs font-bold text-slate-500">{status === "saving" ? <><LoaderCircle className="size-4 animate-spin" />Saving…</> : status === "saved" ? <><Cloud className="size-4 text-emerald-700" />Progress saved</> : "Saved as a draft"}</p></div>
      <div className="mt-7 space-y-5">
        {step === 1 && <><label className="block text-sm font-bold">School name<input {...register("name")} className={input} onBlur={(event) => { if (!values.slug) setValue("slug", event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} /></label><label className="block text-sm font-bold">Profile address<input {...register("slug")} className={input} placeholder="greenfield-school" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">School type<select {...register("schoolType")} className={input}><option value="private">Private</option><option value="public">Public</option><option value="faith_based">Faith-based</option><option value="international">International</option><option value="other">Other</option></select></label><label className="block text-sm font-bold">Year established<input type="number" {...register("yearEstablished")} className={input} /></label></div><label className="block text-sm font-bold">Description <span className="font-semibold text-rose-700">(required to submit)</span><textarea {...register("description")} className={textarea} rows={5} /></label><p className="-mt-3 text-xs leading-5 text-slate-500">Write a short, accurate introduction about the school. Contact details and website are optional.</p><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">Contact email<input type="email" {...register("contactEmail")} className={input} /></label><label className="block text-sm font-bold">Phone<input {...register("contactPhone")} className={input} /></label></div><label className="block text-sm font-bold">Website<input type="url" {...register("websiteUrl")} className={input} placeholder="https://" /></label></>}
        {step === 2 && <><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">Country<input {...register("country")} className={input} /></label><label className="block text-sm font-bold">State<input {...register("state")} className={input} /></label><label className="block text-sm font-bold">City / LGA<input {...register("city")} className={input} /></label><label className="block text-sm font-bold">Area<input {...register("area")} className={input} /></label></div><label className="block text-sm font-bold">Full address <span className="font-semibold text-rose-700">(required to submit)</span><textarea {...register("addressLine")} className={textarea} rows={3} /></label><p className="-mt-3 text-xs leading-5 text-slate-500">Enter the school’s street address or another clear, accurate address parents can use to identify the location.</p><details className="rounded-xl bg-slate-50 p-4"><summary className="text-sm font-bold">Map coordinates (optional)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Latitude<input {...register("latitude")} className={input} /></label><label className="text-sm font-bold">Longitude<input {...register("longitude")} className={input} /></label></div></details></>}
        {step === 3 && <fieldset><legend className="mb-4 text-sm leading-6 text-slate-600">Select every level currently offered. Choose at least one to submit.</legend><CheckGrid name="levels" options={levelOptions} register={register} /></fieldset>}
        {step === 4 && <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">School structure<select {...register("structure")} className={input}><option value="day">Day</option><option value="boarding">Boarding</option><option value="day_and_boarding">Day & boarding</option></select></label><label className="block text-sm font-bold">Gender<select {...register("gender")} className={input}><option value="mixed">Mixed</option><option value="boys">Boys</option><option value="girls">Girls</option></select></label></div>}
        {step === 5 && <fieldset><legend className="mb-4 text-sm leading-6 text-slate-600">Select all curricula used at the school. Choose at least one to submit.</legend><CheckGrid name="curricula" options={curriculumOptions} register={register} /></fieldset>}
        {step === 6 && <fieldset><legend className="mb-4 text-sm leading-6 text-slate-600">Select the facilities available now.</legend><CheckGrid name="facilities" options={facilityOptions} register={register} /></fieldset>}
        {step === 7 && <><p className="text-sm leading-6 text-slate-600">Fees are optional. Add one starting line now; the fee manager supports more later.</p><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">Category<select {...register("feeCategory")} className={input}><option value="tuition">Tuition</option><option value="registration">Registration</option><option value="books">Books</option><option value="uniform">Uniform</option><option value="transport">Transport</option><option value="boarding">Boarding</option><option value="other">Other</option></select></label><label className="block text-sm font-bold">Amount (NGN)<input type="number" {...register("feeAmount")} className={input} /></label><label className="block text-sm font-bold">Term<input {...register("feeTerm")} className={input} placeholder="First term" /></label><label className="block text-sm font-bold">Academic year<input {...register("academicYear")} className={input} placeholder="2026/2027" /></label></div></>}
        {step === 8 && <>{schoolId ? <MediaUploader schoolId={schoolId} onPendingCountChange={setPendingMediaCount} /> : <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">Save the first step before uploading media.</p>}<p className="text-xs leading-5 text-slate-500">Upload and review each image or video here before continuing. New media appears publicly after moderation.</p></>}
        {step === 9 && <><label className="block text-sm font-bold">Admission status<select {...register("admissionStatus")} className={input}><option value="open">Open</option><option value="closed">Closed</option><option value="opening_soon">Opening soon</option></select></label><label className="block text-sm font-bold">Admission description<textarea {...register("admissionDescription")} className={textarea} rows={4} /></label><label className="block text-sm font-bold">Application requirements <span className="font-medium text-slate-500">(one per line)</span><textarea {...register("requirements")} className={textarea} rows={5} /></label></>}
        {step === 10 && <div className="space-y-4">
          <p className="rounded-xl bg-sky-50 p-4 text-sm leading-6 text-sky-950">Review your information before submitting. You can select any step from the progress list to make changes.</p>
          <section aria-labelledby="submission-checklist-title" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 id="submission-checklist-title" className="text-sm font-extrabold text-[#0e2946]">Required before submission</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">These are the four details Skulena checks when you submit for review.</p>
            {checkingSubmission && <p role="status" className="mt-3 text-sm text-slate-500">Checking saved profile details…</p>}
            {submissionCheckError && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{submissionCheckError}</p>}
            {submissionRequirements && <ul className="mt-3 space-y-2">{submissionRequirements.map((requirement) => <li key={requirement.label} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex min-w-0 items-start gap-2"><span className={`mt-0.5 text-xs font-extrabold ${requirement.complete ? "text-emerald-700" : "text-amber-800"}`}>{requirement.complete ? "✓" : "!"}</span><div><p className="text-sm font-bold text-[#0e2946]">{requirement.label} <span className={`font-semibold ${requirement.complete ? "text-emerald-700" : "text-amber-800"}`}>{requirement.complete ? "Complete" : "Needed"}</span></p>{!requirement.complete && <p className="mt-0.5 text-xs leading-5 text-slate-600">{requirement.instruction}</p>}</div></div>
              {!requirement.complete && <Button type="button" variant="outline" size="sm" onClick={() => { setMessage(""); navigateToStep(requirement.step); }}>Go to step</Button>}
            </li>)}</ul>}
            {submissionRequirements?.every((requirement) => requirement.complete) && <p role="status" className="mt-3 text-sm font-semibold text-emerald-800">All required details are saved. You can submit the profile for review.</p>}
          </section>
          {[["School", values.name], ["Location", [values.area, values.city, values.state].filter(Boolean).join(", ")], ["Levels", values.levels.join(", ") || "Not added"], ["Curriculum", values.curricula.join(", ") || "Not added"], ["Facilities", `${values.facilities.length} selected`], ["Admissions", values.admissionStatus.replaceAll("_", " ")]].map(([label, value]) => <div key={label} className="border-b border-slate-100 pb-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-[#0e2946]">{value}</p></div>)}
        </div>}
      </div>
      {(message || Object.keys(errors).length > 0) && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{message || "Check the highlighted information."}</p>}
      {hasUnuploadedMedia && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">Upload or remove your {pendingMediaCount} selected {pendingMediaCount === 1 ? "file" : "files"} before moving to another step.</p>}
      <div className="mt-8 flex items-center justify-between gap-3"><Button type="button" variant="outline" disabled={step === 1 || status === "saving" || hasUnuploadedMedia} onClick={() => setStep((current) => Math.max(1, current - 1))}><ArrowLeft className="size-4" />Back</Button>{step < 10 ? <Button type="button" onClick={() => saveCurrent(true)} disabled={status === "saving" || hasUnuploadedMedia}>{status === "saving" ? "Saving…" : "Save & continue"}<ArrowRight className="size-4" /></Button> : <Button type="button" onClick={submit} disabled={status === "saving"}>Submit school</Button>}</div>
    </section></div>;
}
