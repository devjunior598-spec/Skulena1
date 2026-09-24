import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/auth/actions";

export type PortalItem = { href: string; label: string; icon: LucideIcon };

export function PortalShell({ title, name, items, children }: { title: string; name: string; items: PortalItem[]; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f7faf9]"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Logo /><div className="flex items-center gap-3"><p className="hidden text-sm font-bold text-slate-600 sm:block">{name || title}</p><form action={signOutAction}><Button variant="ghost" size="sm"><LogOut className="size-4" />Sign out</Button></form></div></div></header>
    <div className="mx-auto grid max-w-7xl lg:grid-cols-[240px_minmax(0,1fr)]"><aside className="border-b border-slate-200 bg-white px-4 py-3 lg:min-h-[calc(100vh-4.5rem)] lg:border-b-0 lg:border-r lg:px-5 lg:py-8"><p className="px-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">{title}</p><nav aria-label={`${title} navigation`} className="mt-3 flex gap-1 overflow-x-auto lg:block lg:space-y-1">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"><Icon className="size-4.5" />{label}</Link>)}</nav></aside>
      <main id="main-content" className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main></div></div>;
}
