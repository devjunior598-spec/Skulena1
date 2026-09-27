import Link from "next/link";
import { ArrowRight, Bell, Eye, LockKeyhole, School, Settings2, ShieldCheck, Users } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { WorkspaceCard } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };
const settingLinks = [
  { id: "account", title: "School account", description: "Review your school name, account contact and profile status.", href: "/school/profile", icon: School, action: "Manage school details" },
  { id: "public-profile", title: "Public profile", description: "Preview the information families can see. Draft profiles stay private.", href: "/school/preview", icon: Eye, action: "Preview profile" },
  { id: "team", title: "Team & permissions", description: "See who can access your school workspace and what each role can do.", href: "/school/team", icon: Users, action: "View team" },
  { id: "notifications", title: "Notifications", description: "See updates and messages sent to your account.", href: "/school/notifications", icon: Bell, action: "View notifications" },
  { id: "security", title: "Privacy & security", description: "Keep your sign-in details current and use a strong password.", href: "/forgot-password", icon: LockKeyhole, action: "Change password" },
];

export default async function SettingsPage() {
  const { school } = await getManagedSchool();
  return <>
    <PageHeading eyebrow="Manage your workspace" title="Settings" description="Manage your school account, public profile, team and sign-in details." />
    {school && <div className="mt-5 flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Settings2 className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#0e2946]">{school.name}</p><p className="mt-0.5 text-xs text-slate-500">School workspace settings</p></div></div>}
    <div className="mt-5 grid gap-3 xl:grid-cols-2">{settingLinks.map(({ id, title, description, href, icon: Icon, action }) => <WorkspaceCard id={id} key={id} className="flex min-h-[145px] flex-col justify-between"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-emerald-800"><Icon className="size-5" /></span><div><h2 className="text-sm font-extrabold text-[#0e2946]">{title}</h2><p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-600">{description}</p></div></div><Link href={href} className="mt-4 inline-flex min-h-9 w-fit items-center gap-1 rounded-lg px-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50">{action}<ArrowRight className="size-3.5" /></Link></WorkspaceCard>)}</div>
    <WorkspaceCard className="mt-5 border-sky-100 bg-sky-50/50"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-sky-800" /><div><h2 className="text-sm font-extrabold text-[#0e2946]">Your school remains in control</h2><p className="mt-1 text-xs leading-5 text-slate-600">Publishing and verification are handled through the normal Skulena review process. There are no one-click status changes or destructive account controls here.</p></div></div></WorkspaceCard>
  </>;
}
