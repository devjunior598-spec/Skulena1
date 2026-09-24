import type { VerificationLevel } from "@/data/schools";

/** Fictional evidence records used to demonstrate field-level verification. */
export type VerificationRecord = {
  id: string;
  demo: true;
  schoolSlug: string;
  subject: "profile" | "facility" | "fees";
  subjectKey: string;
  level: Exclude<VerificationLevel, "school-provided">;
  checkedAt: string;
  evidence: string;
};

export const verificationRecords: VerificationRecord[] = [
  {
    id: "demo-greenfield-campus",
    demo: true,
    schoolSlug: "greenfield-international-school",
    subject: "profile",
    subjectKey: "campus",
    level: "physically-verified",
    checkedAt: "2026-06-12",
    evidence: "Sample campus inspection record. Covers the campus visit only; individual facilities have separate evidence below.",
  },
  ...["Science Laboratory", "Library", "Playground"].map((facility): VerificationRecord => ({
    id: `demo-greenfield-${facility.toLowerCase().replaceAll(" ", "-")}`,
    demo: true,
    schoolSlug: "greenfield-international-school",
    subject: "facility",
    subjectKey: facility,
    level: "physically-verified",
    checkedAt: "2026-06-12",
    evidence: `Sample inspection checklist records a visit to the ${facility.toLowerCase()}. This is fictional evidence, not a real inspection.`,
  })),
  {
    id: "demo-greenfield-ict",
    demo: true,
    schoolSlug: "greenfield-international-school",
    subject: "facility",
    subjectKey: "ICT Laboratory",
    level: "document-verified",
    checkedAt: "2026-06-10",
    evidence: "Sample equipment inventory reviewed. This fictional document record does not establish the condition of the facility.",
  },
  {
    id: "demo-greenfield-fees-2026",
    demo: true,
    schoolSlug: "greenfield-international-school",
    subject: "fees",
    subjectKey: "2026-2027",
    level: "document-verified",
    checkedAt: "2026-06-10",
    evidence: "Fictional 2026/2027 tuition schedule reviewed for this demo. Amounts exclude meals, transport, uniforms and boarding.",
  },
  {
    id: "demo-oakbridge-profile",
    demo: true,
    schoolSlug: "the-oakbridge-academy",
    subject: "profile",
    subjectKey: "campus",
    level: "document-verified",
    checkedAt: "2026-06-09",
    evidence: "Fictional school registration document review. This sample record does not cover fees, facilities or an in-person campus visit.",
  },
  {
    id: "demo-horizon-profile",
    demo: true,
    schoolSlug: "horizon-college-ibadan",
    subject: "profile",
    subjectKey: "campus",
    level: "physically-verified",
    checkedAt: "2026-06-11",
    evidence: "Fictional campus visit record. No facility-specific inspection or fee review is included in this sample profile.",
  },
];

export function getVerificationRecord(schoolSlug: string, subject: VerificationRecord["subject"], subjectKey: string) {
  return verificationRecords.find((record) => record.schoolSlug === schoolSlug && record.subject === subject && record.subjectKey === subjectKey);
}

export function getSchoolVerificationLevel(schoolSlug: string): VerificationLevel {
  return getVerificationRecord(schoolSlug, "profile", "campus")?.level ?? "school-provided";
}

export function formatVerificationDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
