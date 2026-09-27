import { ComingSoonWorkspace, futureIcons } from "@/components/school/coming-soon-workspace";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Enquiries" };
export default function EnquiriesPage() { return <ComingSoonWorkspace title="Enquiries" description="A place for questions from families exploring your school." emptyTitle="No enquiries yet" emptyDescription="When families can contact your school through Skulena, their questions will appear here. Until then, families can use the contact details on your published profile." icon={futureIcons.enquiries} />; }
