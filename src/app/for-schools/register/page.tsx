import type { Metadata } from "next";
import { OnboardingForm } from "@/components/school/onboarding-form";
import { getOnboardingDraft } from "@/lib/schools/onboarding";
export const metadata: Metadata = { title: "Register your school" };
export default async function RegisterSchoolPage() { const { values, completion, completedSteps } = await getOnboardingDraft(); return <main id="main-content" className="min-h-screen bg-[#f7faf9] px-5 py-6 sm:px-8 sm:py-10"><div className="mx-auto max-w-6xl"><div className="mb-7"><p className="text-sm font-extrabold text-emerald-700">SKULENA</p><p className="mt-1 text-sm text-slate-500">Build a clear, trusted school profile. Your progress saves as a draft.</p></div><OnboardingForm initialValues={values} initialCompletion={completion} initialCompletedSteps={completedSteps} /></div></main>; }
