import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

const links = [
  { href: "/schools", label: "Find a school" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/about", label: "About Skulena" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="relative mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0e2946]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild><Link href="/sign-in">Sign in</Link></Button>
          <Button asChild><Link href="/for-schools">List your school <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="sm" asChild><Link href="/sign-in">Sign in</Link></Button>
          <details className="group relative">
            <summary aria-label="Open navigation menu" className="grid size-10 list-none place-items-center rounded-xl border border-slate-200 text-[#0e2946] hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav aria-label="Mobile navigation" className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {links.map((link) => <Link key={link.label} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">{link.label}</Link>)}
              <Link href="/for-schools" className="mt-1 flex items-center justify-between rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">List your school <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
