import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";

export const metadata: Metadata = { title: "About Skulena" };

export default function AboutPage() {
  return <UtilityPage icon={Compass} eyebrow="About Skulena" title="A clearer way to explore schools." description="Skulena helps families discover schools and compare the information that matters when choosing where a child learns.">
    <InfoPanel title="School information in one place"><p>Families can explore published school profiles, compare key details and save schools to a private shortlist. School owners can create and maintain their profiles through a dedicated workspace.</p></InfoPanel>
    <InfoPanel id="verification" title="Understanding verification"><p>School-provided information and independent checks are different. Where a verification record is available, Skulena identifies what was checked and the scope of that check. A profile badge does not verify every detail on a school’s profile.</p></InfoPanel>
    <InfoPanel title="Make informed decisions"><p>School details can change. Confirm current fees, admissions requirements and campus information directly with the school before making a decision.</p></InfoPanel>
  </UtilityPage>;
}
