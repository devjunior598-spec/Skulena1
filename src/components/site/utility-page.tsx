import Link from "next/link";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function UtilityPage({ eyebrow, title, description, icon: Icon, children }: { eyebrow: string; title: string; description: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-[#f7faf9] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"><ArrowLeft className="size-4" aria-hidden="true" />Back to home</Link>
          <div className="mt-7 flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon className="size-7" aria-hidden="true" /></div>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#0e2946] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{description}</p>
          <div className="mt-8 space-y-5">{children}</div>
          <Button variant="outline" asChild className="mt-8"><Link href="/schools">Explore demo schools <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}

export function InfoPanel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section id={id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-extrabold text-[#0e2946]">{title}</h2><div className="mt-3 text-sm leading-7 text-slate-600">{children}</div></section>;
}
