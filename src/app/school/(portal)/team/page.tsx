import { Info, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { Button } from "@/components/ui/button";
import { WorkspaceCard } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData } from "@/lib/schools/workspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team & permissions" };
const roleInfo = [
  ["Owner", "Full control of school details and team access."],
  ["Administrator", "Manage school information and help coordinate staff."],
  ["Admissions", "Help keep admissions information current."],
  ["Editor", "Update the school profile, fees and photos."],
  ["Viewer", "See school information without making changes."],
];
const label = (role: string) => role === "owner" ? "Owner" : role === "administrator" ? "Administrator" : role === "admissions" ? "Admissions" : role === "editor" ? "Editor" : "Viewer";

export default async function TeamPage() {
  const { school, supabase, user, profile, membership } = await getManagedSchool();
  if (!school) return <PageHeading eyebrow="Manage your school" title="Team & permissions" description="Set up your school profile first to manage access." />;
  const data = await getSchoolWorkspaceData(supabase, school.id);
  const isOwner = membership?.role === "owner";
  return <>
    <PageHeading eyebrow="Manage your school" title="Team & permissions" description="Invite staff to help manage your school and understand what each role can do." action={<Button disabled title="Team invitations are not available yet"><UserPlus className="size-4" />Invitations coming later</Button>} />
    <WorkspaceCard className="mt-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-extrabold text-[#0e2946]">Your school team</h2><p className="mt-1 text-sm text-slate-500">{data.team.length} active {data.team.length === 1 ? "person" : "people"} can access this workspace.</p></div><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Users className="size-5" /></span></div>
      <ul className="mt-5 divide-y divide-slate-100">{data.team.map((member) => { const isYou = member.user_id === user.id; const isSchoolOwner = member.role === "owner"; const memberName = isYou ? profile.full_name || "Your account" : isSchoolOwner ? "School owner" : "Team member"; return <li key={member.id} className="flex flex-wrap items-center gap-3 py-4"><span className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-extrabold ${isSchoolOwner ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-700"}`}>{memberName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#0e2946]">{memberName}{isYou && <span className="ml-2 text-[10px] font-bold text-slate-400">You</span>}</p><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">{isYou && user.email && <><Mail className="size-3" />{user.email}</>}</p></div><span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700">{label(member.role)}</span></li>; })}</ul>
      {!isOwner && <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-4 shrink-0 text-slate-400" />Only an owner or administrator can invite or change team access.</p>}
    </WorkspaceCard>
    <WorkspaceCard className="mt-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-700" /><h2 className="text-base font-extrabold text-[#0e2946]">What the roles mean</h2></div><dl className="mt-4 grid gap-3 sm:grid-cols-2">{roleInfo.map(([title, description]) => <div key={title} className="rounded-xl bg-slate-50 p-4"><dt className="text-sm font-extrabold text-[#0e2946]">{title}</dt><dd className="mt-1.5 text-xs leading-5 text-slate-600">{description}</dd></div>)}</dl><p className="mt-4 text-xs leading-5 text-slate-500">Staff invitations are not available yet. Your current access is managed by the school owner.</p></WorkspaceCard>
  </>;
}
