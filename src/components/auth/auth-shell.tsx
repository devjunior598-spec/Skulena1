import type { ReactNode } from "react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <><Header /><main id="main-content" className="min-h-[75vh] bg-[#f7faf9] px-5 py-10 sm:px-8 sm:py-16"><div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
    <section className="pt-4 lg:pt-12"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">{eyebrow}</p><h1 className="mt-4 max-w-xl text-4xl font-extrabold tracking-[-.045em] text-[#0e2946] sm:text-5xl">{title}</h1><p className="mt-5 max-w-xl text-base leading-8 text-slate-600">{description}</p></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(14,41,70,.5)] sm:p-8">{children}</section>
  </div></main><Footer /></>;
}
