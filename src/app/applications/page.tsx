import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";
import { Button } from "@/components/ui/button";
import { DemoAction } from "@/components/schools/school-actions";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return <UtilityPage icon={FileText} eyebrow="Your next chapter" title="School applications, in one place." description="Application submission and tracking are planned for a future release. No application has been submitted through this preview.">
    <InfoPanel title="Start with a shortlist"><p>Save schools while exploring. Your shortlist is stored in this browser, so you can return to the sample profiles and review their details.</p><Button asChild className="mt-5"><Link href="/saved">Open saved schools</Link></Button></InfoPanel>
    <InfoPanel title="A preview of what comes next"><p>Future application tools will need a parent account and a connected school admissions service. This demo does not collect child information, upload documents or charge application fees.</p><DemoAction variant="outline" className="mt-5" title="Applications are not connected" description="There is no live admissions service in this demo. No application is created, sent or paid for. You can explore admission details on the sample school profiles.">About applications</DemoAction></InfoPanel>
  </UtilityPage>;
}
