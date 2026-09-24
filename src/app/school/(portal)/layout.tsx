import { BadgeCheck, BookOpenCheck, Building2, CircleDollarSign, Images, LayoutDashboard, MapPinned, Settings, Users } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { requireAccount } from "@/lib/auth";
const items = [
  { href: "/school/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/school/profile", label: "School profile", icon: Building2 },
  { href: "/school/facilities", label: "Facilities", icon: MapPinned }, { href: "/school/fees", label: "Fees", icon: CircleDollarSign },
  { href: "/school/media", label: "Media", icon: Images }, { href: "/school/admissions", label: "Admissions", icon: BookOpenCheck },
  { href: "/school/verification", label: "Verification", icon: BadgeCheck }, { href: "/school/team", label: "Team", icon: Users },
  { href: "/school/settings", label: "Settings", icon: Settings },
];
export default async function SchoolPortalLayout({ children }: { children: React.ReactNode }) { const { profile } = await requireAccount(["school_owner", "school_staff"]); return <PortalShell title="School workspace" name={profile.full_name} items={items}>{children}</PortalShell>; }
