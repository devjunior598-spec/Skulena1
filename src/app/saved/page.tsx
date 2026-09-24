import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MobileNav } from "@/components/site/mobile-nav";
import { SavedSchools } from "./saved-schools";

export const metadata: Metadata = { title: "Saved schools" };

export default function SavedPage() {
  return <><Header /><main id="main-content" className="min-h-[65vh] bg-[#f7faf9] px-5 py-12 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Your shortlist</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#0e2946] sm:text-4xl">Saved schools</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Keep your favourites together as you explore. Saved schools stay in this browser when local storage is available; no account is needed.</p><SavedSchools /></div></main><Footer /><MobileNav /></>;
}
