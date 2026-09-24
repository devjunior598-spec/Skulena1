import Link from "next/link";
import { Heart } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyState } from "@/components/portal/empty-state";
import { Button } from "@/components/ui/button";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export default async function ParentSavedPage() {
  const { user } = await requireAccount(["parent"]);
  const supabase = (await createClient())!;
  const { data: saved } = await supabase.from("saved_schools").select("school_id, created_at").eq("parent_id", user.id).order("created_at", { ascending: false });
  const ids = (saved ?? []).map((row) => row.school_id);
  const { data: schools } = ids.length
    ? await supabase.from("public_school_profiles").select("id, name, slug").in("id", ids)
    : { data: [] };
  const publicSchools = new Map((schools ?? []).map((school) => [school.id, school]));
  const rows = (saved ?? []).map((row) => ({ ...row, school: publicSchools.get(row.school_id) })).filter((row) => row.school);
  return <><PageHeading eyebrow="Your shortlist" title="Saved schools" description="Your account shortlist follows you across devices." /><div className="mt-8">{rows.length ? <div className="grid gap-4">{rows.map((row) => <Link key={row.school_id} href={`/school/${row.school!.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300"><h2 className="font-extrabold text-[#0e2946]">{row.school!.name}</h2><p className="mt-1 text-sm text-slate-500">View published profile</p></Link>)}</div> : <EmptyState icon={Heart} title="Your shortlist is empty" description="Save a published school to see it here."><Button asChild><Link href="/schools">Find schools</Link></Button></EmptyState>}</div></>;
}
