import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";

export const metadata: Metadata = {
  title: "About Skulena",
  description: "Learn how Skulena helps Nigerian families discover schools, understand school information and apply when admissions are open.",
};

export default function AboutPage() {
  return <UtilityPage icon={Compass} eyebrow="About Skulena" title="A clearer way to explore schools." description="Skulena brings school profiles and the next steps families need into one place, from discovery to an application when a school is accepting students.">
    <InfoPanel title="Explore schools with useful details"><p>Browse published profiles to see a school’s location, learning levels, curriculum, facilities, photos, published fees and admissions information. Save schools to a private shortlist so you can return to them as you decide.</p></InfoPanel>
    <InfoPanel title="Apply and keep track"><p>When a school opens admissions, families can apply for a child, provide requested documents, request a visit and follow application updates. Parents and school staff can communicate about an application in Skulena.</p><Button asChild variant="outline" className="mt-4"><Link href="/schools">Explore schools <ArrowRight className="size-4" aria-hidden="true" /></Link></Button></InfoPanel>
    <InfoPanel title="A workspace for schools"><p>School teams can manage their profile, share their logo and campus photos, keep fee and facility information current, and review applications through their school workspace. Submitted profiles and logos are reviewed before they appear publicly.</p><Button asChild variant="outline" className="mt-4"><Link href="/for-schools">For schools <ArrowRight className="size-4" aria-hidden="true" /></Link></Button></InfoPanel>
    <InfoPanel id="verification" title="Understanding verification"><p>School-provided information and independent checks are different. Where a verification record is available, Skulena identifies what was checked and the scope of that check. A profile badge does not verify every detail on a school’s profile.</p></InfoPanel>
    <InfoPanel title="Make informed decisions"><p>School details can change. Confirm current fees, admissions requirements and campus information directly with the school before making a decision.</p></InfoPanel>
  </UtilityPage>;
}
