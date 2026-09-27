"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  BadgeCheck, Bell, BookOpenCheck, Building2, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, GraduationCap, HelpCircle, Images, LayoutDashboard, MapPinned,
  Menu, MessageCircle, MessageSquareText, Settings, ShieldCheck, Star, UserRound,
  Users, WalletCards, X,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { signOutAction } from "@/app/auth/actions";
import { switchManagedSchool } from "@/app/school/(portal)/workspace-actions";
import type { PortalItem } from "@/components/portal/portal-shell";

const groups: { title: string; items: PortalItem[] }[] = [
  { title: "Home", items: [{ href: "/school/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { title: "Your school", items: [
    { href: "/school/profile", label: "School profile", icon: Building2 },
    { href: "/school/facilities", label: "Facilities", icon: MapPinned },
    { href: "/school/media", label: "Photos & videos", icon: Images },
    { href: "/school/fees", label: "Fees", icon: CircleDollarSign },
  ] },
  { title: "Admissions", items: [
    { href: "/school/admissions", label: "Admissions", icon: BookOpenCheck },
    { href: "/school/applications", label: "Applications", icon: GraduationCap },
    { href: "/school/visits", label: "Visits", icon: UserRound },
    { href: "/school/schoolpay", label: "SchoolPay", icon: WalletCards },
  ] },
  { title: "Communication", items: [
    { href: "/school/enquiries", label: "Enquiries", icon: MessageCircle },
    { href: "/school/messages", label: "Messages", icon: MessageSquareText },
    { href: "/school/reviews", label: "Reviews", icon: Star },
  ] },
  { title: "Trust", items: [{ href: "/school/verification", label: "Verification", icon: ShieldCheck }] },
  { title: "Manage", items: [
    { href: "/school/team", label: "Team", icon: Users },
    { href: "/school/settings", label: "Settings", icon: Settings },
  ] },
];

function NavGroups({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="School workspace" className="space-y-5">
    {groups.map((group) => <div key={group.title}>
      {!collapsed && <h2 className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">{group.title}</h2>}
      <div className="space-y-0.5">{group.items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/school/dashboard" && pathname.startsWith(`${href}/`));
        return <Link key={href} href={href} onClick={onNavigate} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined}
          aria-label={collapsed ? label : undefined} className={`group flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${active ? "bg-emerald-50 text-emerald-900 shadow-[inset_3px_0_0_#07865f]" : "text-slate-600 hover:bg-slate-50 hover:text-[#0e2946]"}`}>
          <Icon className={`size-[18px] shrink-0 ${active ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"}`} aria-hidden="true" />
          {!collapsed && <span className="truncate">{label}</span>}
          {collapsed && <span className="sr-only">{label}</span>}
        </Link>;
      })}</div>
    </div>)}
  </nav>;
}

function SchoolMark({ logo, name }: { logo?: string | null; name?: string | null }) {
  return logo ? <Image src={logo} alt={`${name ?? "School"} logo`} width={38} height={38} unoptimized className="size-9 rounded-xl border border-slate-200 bg-white object-contain p-1" />
    : <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Building2 className="size-[18px]" /></span>;
}

export function SchoolWorkspaceShell({
  children, schoolName, schoolStatus, schoolLogo, currentSchoolId, schoolOptions = [], fullName, avatarUrl, email, notifications = 0,
}: {
  children: React.ReactNode; schoolName?: string | null; schoolStatus?: string | null; schoolLogo?: string | null; avatarUrl?: string | null;
  currentSchoolId?: string; schoolOptions?: Array<{ id: string; name: string; status: string }>;
  fullName: string; email?: string; notifications?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const title = groups.flatMap((group) => group.items).find((item) => item.href === pathname)?.label ?? (pathname === "/school/preview" ? "Profile preview" : pathname === "/school/notifications" ? "Notifications" : "School workspace");
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
  const schoolContext = schoolOptions.length > 1 ? <details className="relative mx-3 mb-5">
    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-emerald-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 [&::-webkit-details-marker]:hidden">
      <SchoolMark logo={schoolLogo} name={schoolName} />
      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-[#0e2946]">{schoolName || "Select your school"}</span><span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold capitalize text-slate-500"><span className={`size-1.5 rounded-full ${schoolStatus === "published" ? "bg-emerald-500" : "bg-amber-500"}`} />{schoolStatus?.replaceAll("_", " ") ?? "Profile not started"}</span></span>
      <ChevronDown className="size-4 shrink-0 text-slate-400" />
    </summary>
    <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">{schoolOptions.map((item) => item.id === currentSchoolId ? <div key={item.id} className="flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-extrabold text-emerald-900"><Building2 className="size-4" /><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="text-[9px] uppercase tracking-wide">Current</span></div> : <form key={item.id} action={switchManagedSchool}><input type="hidden" name="schoolId" value={item.id} /><button className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"><Building2 className="size-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="text-[9px] capitalize text-slate-400">{item.status.replaceAll("_", " ")}</span></button></form>)}</div>
  </details> : <Link href="/school/profile" className="mx-3 mb-5 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-emerald-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
    <SchoolMark logo={schoolLogo} name={schoolName} />
    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-[#0e2946]">{schoolName || "Set up your school"}</span><span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold capitalize text-slate-500"><span className={`size-1.5 rounded-full ${schoolStatus === "published" ? "bg-emerald-500" : "bg-amber-500"}`} />{schoolStatus?.replaceAll("_", " ") ?? "Profile not started"}</span></span>
  </Link>;

  const sidebar = (isDrawer = false) => <>
    <div className={`flex h-[68px] items-center ${collapsed && !isDrawer ? "justify-center px-3" : "justify-between px-5"}`}>
      <Logo compact={collapsed && !isDrawer} />
      {isDrawer ? <button type="button" aria-label="Close navigation" onClick={() => drawer.current?.close()} className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="size-5" /></button>
        : <button type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:grid">{collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>}
    </div>
    {(!collapsed || isDrawer) && schoolContext}
    {collapsed && !isDrawer && <Link href="/school/profile" title={schoolName || "School profile"} aria-label="School profile" className="mx-auto mb-5 grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50"><SchoolMark logo={schoolLogo} name={schoolName} /></Link>}
    <div className={`${collapsed && !isDrawer ? "px-2" : "px-3"}`}><NavGroups collapsed={collapsed && !isDrawer} onNavigate={isDrawer ? () => drawer.current?.close() : undefined} /></div>
  </>;

  return <div className="min-h-screen bg-[#f6f8f7] text-slate-800">
    <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:block ${collapsed ? "w-[76px]" : "w-[254px]"}`}>
      {sidebar()}
      {!collapsed && <div className="absolute inset-x-3 bottom-4 rounded-2xl bg-[#f2f7f5] p-3"><div className="flex items-center gap-2 text-xs font-extrabold text-[#0e2946]"><BadgeCheck className="size-4 text-emerald-700" />Need a hand?</div><p className="mt-1.5 text-[11px] leading-4 text-slate-600">Find guidance for managing your school profile.</p><Link href="/for-schools" className="mt-2 inline-flex min-h-8 items-center gap-1 text-xs font-extrabold text-emerald-800">Help centre <ChevronRight className="size-3.5" /></Link></div>}
    </aside>
    <dialog ref={drawer} className="m-0 h-dvh max-h-none w-[min(86vw,320px)] max-w-none border-0 bg-white p-0 text-left shadow-2xl backdrop:bg-slate-950/40 lg:hidden" aria-label="School workspace navigation">
      <div className="relative h-full overflow-y-auto pb-6">{sidebar(true)}</div>
    </dialog>
    <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[254px]"}`}>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open navigation" onClick={() => drawer.current?.showModal()} className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"><Menu className="size-5" /></button>
            <div className="min-w-0"><p className="truncate text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">{schoolName || "School workspace"}</p><p className="truncate text-sm font-extrabold text-[#0e2946]">{title}</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/school/notifications" aria-label={notifications ? `${notifications} unread notifications` : "Notifications"} title="Notifications" className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-[#0e2946] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Bell className="size-[18px]" />{notifications > 0 && <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-emerald-700 px-1 text-[9px] font-extrabold text-white">{notifications > 9 ? "9+" : notifications}</span>}</Link>
            <Link href="/for-schools" aria-label="Help and support" title="Help & support" className="hidden size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-[#0e2946] sm:grid"><HelpCircle className="size-[18px]" /></Link>
            <details className="group relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl pl-1 pr-2 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 [&::-webkit-details-marker]:hidden">
                <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#e7f3ed] text-xs font-extrabold text-emerald-900">{avatarUrl ? <Image src={avatarUrl} alt="" width={32} height={32} unoptimized className="size-full object-cover" /> : initials}</span><span className="hidden max-w-28 truncate text-left text-xs font-bold text-slate-700 md:block">{fullName}</span><ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
              </summary>
              <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="truncate px-3 py-2 text-xs font-bold text-slate-500">{email || fullName}</p><div className="my-1 border-t border-slate-100" />
                <Link href="/school/settings#account" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><UserRound className="size-4 text-slate-400" />My account</Link>
                <Link href="/for-schools" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><HelpCircle className="size-4 text-slate-400" />Help & support</Link>
                <form action={signOutAction}><button className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-rose-700 hover:bg-rose-50"><X className="size-4" />Sign out</button></form>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">{children}</main>
    </div>
  </div>;
}
