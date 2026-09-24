import { Baby, Heart, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { requireAccount } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";

const items = [
  { href: "/parent", label: "Overview", icon: LayoutDashboard }, { href: "/parent/saved", label: "Saved schools", icon: Heart },
  { href: "/parent/children", label: "Children", icon: Baby }, { href: "/parent/profile", label: "Profile", icon: UserRound },
  { href: "/parent/settings", label: "Settings", icon: Settings },
];
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAccount(["parent"]);
  return <PortalShell title="Parent account" name={profile.full_name} items={items}>{children}</PortalShell>;
}
