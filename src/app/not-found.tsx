import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

export default function NotFound() {
  return <main id="main-content" className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-6 px-6"><Logo /><p className="font-bold text-emerald-700">Page not found</p><h1 className="text-4xl font-extrabold tracking-tight">Let’s find your way back.</h1><p className="leading-7 text-slate-600">This school or page isn’t available in the demo. You can explore all available schools below.</p><Button asChild><Link href="/schools">Find schools</Link></Button></main>;
}
