"use client";

import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { schools } from "@/data/schools";
import { SchoolCard } from "@/components/schools/school-card";
import { useSavedSchools } from "@/components/schools/school-actions";
import { Button } from "@/components/ui/button";

export function SavedSchools() {
  const { savedSlugs } = useSavedSchools();
  const saved = schools.filter((school) => savedSlugs.includes(school.slug));
  return <div className="mt-8">
    <p role="status" className="mb-5 text-sm font-bold text-slate-600">{saved.length} {saved.length === 1 ? "school" : "schools"} saved on this device</p>
    {saved.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{saved.map((school) => <SchoolCard key={school.slug} school={school} />)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-500"><Heart className="size-6" aria-hidden="true" /></div><h2 className="mt-5 text-xl font-extrabold text-[#0e2946]">Your shortlist starts here</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">Tap the heart on a school to save it. Return here whenever you want to take another look.</p><Button asChild className="mt-6"><Link href="/schools"><Search className="size-4" aria-hidden="true" />Find schools</Link></Button></div>}
  </div>;
}
