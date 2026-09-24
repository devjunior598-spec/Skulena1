import { CircleDollarSign } from "lucide-react"; import { SchoolSectionPlaceholder } from "@/components/school/section-placeholder";
export default function Page() { return <SchoolSectionPlaceholder icon={CircleDollarSign} title="Fees" description="Manage optional fee lines by level, term and academic year." empty="No fee lines have been added for this school." />; }
