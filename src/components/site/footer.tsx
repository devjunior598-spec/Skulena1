import Link from "next/link";
import { Logo } from "./logo";

const groups = [
  { title: "Explore", links: [{ label: "Find schools", href: "/schools" }, { label: "Saved schools", href: "/saved" }] },
  { title: "For schools", links: [{ label: "List your school", href: "/for-schools" }, { label: "School portal", href: "/sign-in" }, { label: "Verification explained", href: "/about#verification" }] },
  { title: "Company", links: [{ label: "About us", href: "/about" }] },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#f8fafb] py-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.4fr_2fr] lg:px-10">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">Helping families discover the right school, with a clearer view of fees, facilities and learning.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-extrabold text-[#0e2946]">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-slate-600 hover:text-emerald-700">{link.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-14 max-w-7xl border-t border-slate-200 px-5 pt-6 text-xs text-slate-500 sm:px-8 lg:px-10">© {new Date().getFullYear()} Skulena. All rights reserved.</div>
    </footer>
  );
}
