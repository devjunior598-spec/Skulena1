import { Baby } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyState } from "@/components/portal/empty-state";
import { ChildForm } from "@/components/parent/child-form";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ChildrenPage() {
  const { user } = await requireAccount(["parent"]); const supabase = await createClient();
  const { data: children } = await supabase!.from("children").select("id, first_name, last_name, current_level, target_level, created_at").eq("parent_id", user.id).order("created_at");
  return <><PageHeading eyebrow="Private profiles" title="Children" description="Store only what you need for later applications. These details are never public." action={<ChildForm />} /><div className="mt-8">{children?.length ? <div className="grid gap-4 sm:grid-cols-2">{children.map((child) => <article key={child.id} className="rounded-2xl border border-slate-200 bg-white p-5"><Baby className="size-5 text-emerald-700" /><h2 className="mt-4 text-lg font-extrabold text-[#0e2946]">{child.first_name} {child.last_name}</h2><p className="mt-2 text-sm text-slate-500">{child.target_level ? `Target: ${child.target_level}` : child.current_level || "Level not added"}</p></article>)}</div> : <EmptyState icon={Baby} title="No child profiles yet" description="Add a private profile when you are ready. You can browse and save schools without one." />}</div></>;
}
