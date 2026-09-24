import Link from "next/link";
import { Baby, Heart, Search } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAccount } from "@/lib/auth";

export default async function ParentDashboard() {
  const { user, profile } = await requireAccount(["parent"]);
  const supabase = await createClient();
  const [{ count: savedCount }, { count: childCount }] = await Promise.all([
    supabase!.from("saved_schools").select("*", { count: "exact", head: true }).eq("parent_id", user.id),
    supabase!.from("children").select("*", { count: "exact", head: true }).eq("parent_id", user.id),
  ]);
  return <><PageHeading eyebrow="Parent dashboard" title={`Welcome${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`} description="Keep your shortlist and child details in one private place." />
    <div className="mt-8 grid gap-4 sm:grid-cols-2"><Link href="/parent/saved" className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300"><Heart className="size-5 text-emerald-700" /><p className="mt-5 text-3xl font-extrabold text-[#0e2946]">{savedCount ?? 0}</p><p className="mt-1 text-sm font-semibold text-slate-500">Saved schools</p></Link><Link href="/parent/children" className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300"><Baby className="size-5 text-sky-700" /><p className="mt-5 text-3xl font-extrabold text-[#0e2946]">{childCount ?? 0}</p><p className="mt-1 text-sm font-semibold text-slate-500">Private child profiles</p></Link></div>
    <section className="mt-8 rounded-2xl bg-[#0e2946] p-6 text-white"><Search className="size-6 text-emerald-300" /><h2 className="mt-4 text-xl font-extrabold">Find a school that fits.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">Browse published profiles. Your child information stays private and is not shared during discovery.</p><Button asChild className="mt-5"><Link href="/schools">Explore schools</Link></Button></section>
  </>;
}
