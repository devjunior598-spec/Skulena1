import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

const links = [
  { href: "/schools", label: "Find Schools" },
  { href: "/#locations", label: "Explore" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2.5"><Logo /><span className="rounded-md bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-800">Demo</span></div>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0e2946]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="ghost" asChild><Link href="/sign-in">Sign in</Link></Button>
          <Button asChild><Link href="/for-schools">List your school <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></Button>
        </div>
        <Button variant="outline" size="sm" asChild className="sm:hidden"><Link href="/sign-in">Sign in</Link></Button>
      </div>
    </header>
  );
}
