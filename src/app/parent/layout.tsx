import { Baby, CalendarDays, ClipboardList, Heart, LayoutDashboard, MessageSquareText, Settings, UserRound, WalletCards } from "lucide-react";
import { requireAccount } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";

const items = [
  { href: "/parent", label: "Overview", icon: LayoutDashboard }, { href: "/parent/saved", label: "Saved schools", icon: Heart },
  { href: "/parent/children", label: "Children", icon: Baby }, { href: "/parent/visits", label: "Visits", icon: CalendarDays },
  { href: "/parent/applications", label: "Applications", icon: ClipboardList }, { href: "/parent/messages", label: "Messages", icon: MessageSquareText },
  { href: "/parent/schoolpay", label: "SchoolPay", icon: WalletCards }, { href: "/parent/profile", label: "Profile", icon: UserRound },
  { href: "/parent/settings", label: "Settings", icon: Settings },
];
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAccount(["parent"]);
  return <PortalShell title="Parent account" name={profile.full_name} items={items}>{children}</PortalShell>;
}
