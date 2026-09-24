import type { Metadata } from "next";
import { School } from "lucide-react";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For schools" };

export default function ForSchoolsPage() {
  return <UtilityPage icon={School} eyebrow="For school communities" title="Help families get to know your school." description="Skulena is being designed to bring school information, facilities and admissions into one clear profile. This preview demonstrates that experience with sample schools.">
    <InfoPanel title="A profile with the details parents need"><p>The planned school portal will let schools manage their curriculum, fee ranges, facilities and admissions information. School submissions will be clearly distinguished from independently checked details.</p></InfoPanel>
    <InfoPanel title="Create your school profile"><p>School owners can now create a secure account and build a profile at their own pace. New profiles remain drafts until they are submitted and reviewed.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href="/for-schools/register">Register your school</Link></Button><Button asChild variant="outline"><Link href="/school/dashboard">School dashboard</Link></Button></div></InfoPanel>
  </UtilityPage>;
}
