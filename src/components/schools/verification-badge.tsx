import { BadgeCheck, FileCheck2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VerificationLevel } from "@/data/schools";

const config = {
  "physically-verified": { label: "Physically verified", icon: BadgeCheck, className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  "document-verified": { label: "Documents verified", icon: FileCheck2, className: "border-sky-200 bg-sky-50 text-sky-800" },
  "school-provided": { label: "School provided", icon: Info, className: "border-slate-200 bg-slate-50 text-slate-700" },
} as const;

export function VerificationBadge({ level, short = false }: { level: VerificationLevel; short?: boolean }) {
  const item = config[level];
  const Icon = item.icon;
  return <Badge className={item.className}><Icon className="size-3.5" />{short && level === "physically-verified" ? "Verified" : item.label}</Badge>;
}
