import Link from "next/link";
import { Heart } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyState } from "@/components/portal/empty-state";
import { SchoolCard } from "@/components/schools/school-card";
import { Button } from "@/components/ui/button";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPublicSchools } from "@/lib/schools/public-schools";

export default async function ParentSavedPage() {
  const { user } = await requireAccount(["parent"]);
  const supabase = (await createClient())!;
  const { data: saved } = await supabase.from("saved_schools").select("school_id, created_at").eq("parent_id", user.id).order("created_at", { ascending: false });
  const schoolIds = (saved ?? []).map((row) => row.school_id);
  const loadedSchools = await getPublicSchools({ ids: schoolIds });
  const savedOrder = new Map(schoolIds.map((id, index) => [id, index]));
  const schools = [...loadedSchools].sort((a, b) => (savedOrder.get(a.databaseId ?? "") ?? Number.MAX_SAFE_INTEGER) - (savedOrder.get(b.databaseId ?? "") ?? Number.MAX_SAFE_INTEGER));

  return <><PageHeading eyebrow="Your shortlist" title="Saved schools" description="Your account shortlist follows you across devices. Only profiles currently published on Skulena appear here." /><div className="mt-8">{schools.length ? <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">{schools.map((school) => <SchoolCard key={school.slug} school={school} initialSaved showSave />)}</div> : <EmptyState icon={Heart} title="Your shortlist is empty" description="Save a published school to see it here."><Button asChild><Link href="/schools">Find schools</Link></Button></EmptyState>}</div></>;
}
