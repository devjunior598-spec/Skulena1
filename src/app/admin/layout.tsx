import { ClipboardCheck, WalletCards } from "lucide-react";
import { PortalShell, type PortalItem } from "@/components/portal/portal-shell";
import { requireAccount } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAccount(["inspector", "moderator", "admin", "super_admin"]);
  const items: PortalItem[] = [
    { href: "/admin", label: "School review", icon: ClipboardCheck },
    ...(profile.role === "admin" || profile.role === "super_admin" ? [{ href: "/admin/schoolpay", label: "SchoolPay operations", icon: WalletCards }] : []),
  ];
  return <PortalShell title="Skulena trust workspace" name={profile.full_name || "Skulena staff"} items={items}>{children}</PortalShell>;
}
