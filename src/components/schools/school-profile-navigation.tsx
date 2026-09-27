"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SchoolProfileSection } from "@/components/schools/school-profile-shell";

type NavItem = { id: SchoolProfileSection; label: string };

export function SchoolProfileNavigation({ sections, slug, activeSection, anchored }: { sections: readonly NavItem[]; slug: string; activeSection: SchoolProfileSection; anchored: boolean }) {
  const [current, setCurrent] = useState<SchoolProfileSection>(activeSection);

  useEffect(() => {
    if (!anchored) return;
    const ids = sections.map((section) => section.id);
    const targets = ids.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    if (!targets.length) return;

    const onHashChange = () => {
      let hash = "";
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (ids.includes(hash as SchoolProfileSection)) setCurrent(hash as SchoolProfileSection);
      else if (!hash) setCurrent("overview");
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setCurrent(visible[0].target.id as SchoolProfileSection);
    }, { rootMargin: "-104px 0px -68% 0px", threshold: [0, 0.15, 0.5] });
    targets.forEach((target) => observer.observe(target));
    window.addEventListener("hashchange", onHashChange);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [activeSection, anchored, sections]);

  const profileBase = `/school/${encodeURIComponent(slug)}`;
  return <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 [scrollbar-width:thin] sm:px-8 lg:px-10" aria-label="School profile sections">
    {sections.map((item) => {
      const active = item.id === (anchored ? current : activeSection);
      const href = anchored ? `${profileBase}#${item.id}` : item.id === "overview" ? profileBase : `${profileBase}/${item.id}`;
      return <Link key={item.id} href={href} aria-current={active ? "location" : undefined} className={`min-h-12 shrink-0 border-b-2 px-3 py-3.5 text-xs font-bold transition-colors sm:px-4 sm:text-sm ${active ? "border-emerald-700 text-emerald-900" : "border-transparent text-slate-600 hover:border-emerald-300 hover:text-emerald-800"}`}>
        {item.label}
      </Link>;
    })}
  </nav>;
}
