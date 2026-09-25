import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return <UtilityPage icon={FileText} eyebrow="Admissions" title="Apply directly with the school." description="Skulena currently helps families discover and compare school information. Applications are handled by each school.">
    <InfoPanel title="Keep schools you are considering together"><p>Save published schools to your account shortlist, then contact each school to confirm current admissions requirements and application steps.</p><Button asChild className="mt-5"><Link href="/saved">Open saved schools</Link></Button></InfoPanel>
  </UtilityPage>;
}
