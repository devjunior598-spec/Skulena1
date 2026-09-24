import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";

export const metadata: Metadata = { title: "About this preview" };

export default function AboutPage() {
  return <UtilityPage icon={Compass} eyebrow="About Skulena" title="A clearer way to explore schools." description="We are designing Skulena to help families understand their options and make informed school choices. This working product preview uses four fictional school listings in Ibadan.">
    <InfoPanel title="What you can explore"><p>Search and filter sample schools, inspect profiles and save a shortlist locally. Names, prices, ratings, reviews and verification records are demonstration data. Photographs are illustrative stock images and do not show the listed schools.</p></InfoPanel>
    <InfoPanel id="verification" title="Understanding verification"><p>School-provided information, document checks and physical visits represent different levels of evidence. The sample verification records show how this distinction could work; no real school or facility has been verified through this preview. Verification should describe what was checked, by whom and when.</p></InfoPanel>
    <InfoPanel id="privacy" title="Privacy in this preview"><p>Saved school identifiers are stored in your browser’s local storage and can be removed with the same heart control. This preview has no account, payment or application service and does not request your location or collect form submissions. School images are loaded from an external image service.</p></InfoPanel>
    <InfoPanel id="preview-terms" title="Using the preview"><p>All school information is illustrative and is not an offer of admission, a fee quote or an endorsement. Contact, visit, registration and application actions explain planned workflows; they do not send requests. Use this demo to evaluate the experience, not to make decisions about an actual school.</p></InfoPanel>
  </UtilityPage>;
}
