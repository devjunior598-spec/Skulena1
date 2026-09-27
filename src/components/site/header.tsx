import Link from "next/link";
import { ArrowUpRight, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentAccount, roleHome } from "@/lib/auth";
import { Logo } from "./logo";

const links = [
  { href: "/schools", label: "Find a school" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/about", label: "About Skulena" },
];

function SchoolSearch({ mobile = false }: { mobile?: boolean }) {
  return <form action="/schools" role="search" className={mobile ? "relative" : "relative hidden w-48 shrink-0 lg:block xl:w-64"}>
    <label className="sr-only" htmlFor={mobile ? "mobile-school-search" : "school-search"}>Search schools, location or keyword</label>
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    <input id={mobile ? "mobile-school-search" : "school-search"} type="search" name="q" placeholder="Search schools, location or keyword..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
  </form>;
}

export async function Header({ accountHref }: { accountHref?: string | null }) {
  let destination = accountHref;
  if (destination === undefined) {
    try {
      const account = await getCurrentAccount();
      destination = account?.profile ? roleHome(account.profile.role) : null;
    } catch {
      destination = null;
    }
  }
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-2 px-4 sm:px-8 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {links.map((link) => <Link key={link.label} href={link.href} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0e2946] lg:px-3 xl:text-sm">{link.label}</Link>)}
        </nav>
        <SchoolSearch />
        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          {destination ? <Button asChild><Link href={destination}>My account <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></Button> : <>
            <Button variant="ghost" asChild><Link href="/sign-in">Log in</Link></Button>
            <Button asChild><Link href="/sign-up">Sign up</Link></Button>
          </>}
        </div>
        <div className="flex shrink-0 items-center gap-1 md:hidden">
          {!destination && <Button variant="ghost" size="sm" asChild><Link href="/sign-in">Log in</Link></Button>}
          {destination && <Button variant="ghost" size="sm" asChild><Link href={destination}>Account</Link></Button>}
          <details className="group relative">
            <summary aria-label="Open navigation menu" className="grid size-11 list-none place-items-center rounded-xl border border-slate-200 text-[#0e2946] hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <SchoolSearch mobile />
              <nav aria-label="Mobile navigation" className="mt-2">
                {links.map((link) => <Link key={link.label} href={link.href} className="block min-h-11 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">{link.label}</Link>)}
              </nav>
              {!destination && <Link href="/sign-up" className="mt-1 flex min-h-11 items-center justify-between rounded-xl bg-emerald-700 px-3 py-3 text-sm font-bold text-white hover:bg-emerald-800">Create an account <ArrowUpRight className="size-4" aria-hidden="true" /></Link>}
              {destination && <Link href={destination} className="mt-1 flex min-h-11 items-center justify-between rounded-xl bg-emerald-700 px-3 py-3 text-sm font-bold text-white hover:bg-emerald-800">My account <ArrowUpRight className="size-4" aria-hidden="true" /></Link>}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
