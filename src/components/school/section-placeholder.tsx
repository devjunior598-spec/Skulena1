import { EmptyState } from "@/components/portal/empty-state";
import { PageHeading } from "@/components/portal/page-heading";
import type { LucideIcon } from "lucide-react";
export function SchoolSectionPlaceholder({ icon, title, description, empty, children }: { icon: LucideIcon; title: string; description: string; empty: string; children?: React.ReactNode }) { return <><PageHeading eyebrow="School workspace" title={title} description={description} /><div className="mt-8"><EmptyState icon={icon} title={`No ${title.toLowerCase()} added`} description={empty}>{children}</EmptyState></div></>; }
