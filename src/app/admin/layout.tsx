import { ClipboardCheck } from "lucide-react";
import { PortalShell, type PortalItem } from "@/components/portal/portal-shell";
import { requireAccount } from "@/lib/auth";

const items: PortalItem[] = [
  { href: "/admin", label: "School review", icon: ClipboardCheck },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAccount(["inspector", "moderator", "admin", "super_admin"]);
  return <PortalShell title="Skulena trust workspace" name={profile.full_name || "Skulena staff"} items={items}>{children}</PortalShell>;
}
