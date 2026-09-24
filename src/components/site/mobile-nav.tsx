"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Heart, Home, Search, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/schools", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 h-[var(--mobile-nav-height)] border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
      <div className="mx-auto flex max-w-xl justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/schools" ? pathname.startsWith("/school") : href === "/profile" ? pathname === "/profile" || pathname === "/sign-in" : pathname === href;
          return (
          <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 min-w-15 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition hover:bg-emerald-50 ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500"}`}>
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
            {label}
          </Link>
        ); })}
      </div>
    </nav>
  );
}
