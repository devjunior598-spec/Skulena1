import Image from "next/image";
import { BookOpen, Bus, Check, Computer, FlaskConical, HeartPulse, Library, MapPinned, Plus, Shield, Sparkles, Sprout, Trash2, Utensils, Volleyball } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { Button } from "@/components/ui/button";
import { EmptyHint, WorkspaceCard, WorkspaceFeedback, type WorkspaceSearchParams } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData } from "@/lib/schools/workspace";
import { addFacility, deleteFacility } from "@/app/school/(portal)/workspace-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Facilities" };
type PageProps = { searchParams?: WorkspaceSearchParams };

const icons: Record<string, typeof MapPinned> = {
  classroom: BookOpen, library: Library, ict: Computer, science: FlaskConical, playground: Sprout,
  sports: Volleyball, transport: Bus, dining: Utensils, kitchen: Utensils, sick: HeartPulse,
  toilet: Sparkles, boarding: Building2, security: Shield, special: HeartPulse,
};
import { Building2 } from "lucide-react";
function facilityIcon(name: string) { const key = name.toLowerCase(); const match = Object.keys(icons).find((token) => key.includes(token)); return icons[match ?? ""] ?? Building2; }

export default async function FacilitiesPage({ searchParams }: PageProps) {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <PageHeading eyebrow="Your school" title="Facilities" description="Add your school profile first to manage its facilities." />;
  const [data, { data: catalog }, { data: branches }] = await Promise.all([
    getSchoolWorkspaceData(supabase, school.id),
    supabase.from("facilities").select("id, code, name").order("name"),
    supabase.from("school_branches").select("id, name, is_main").eq("school_id", school.id).order("is_main", { ascending: false }),
  ]);
  const categories = [...new Set((catalog ?? []).map((item) => item.name))];
  const photoCount = (category: string) => data.media.filter((item) => item.category.toLowerCase().includes(category.toLowerCase().split(" ")[0]) && item.media_type === "image").length;
  return <>
    <WorkspaceFeedback searchParams={searchParams} />
    <PageHeading eyebrow="Your school" title="Facilities" description="Show parents the spaces, services and activities your school provides." action={<a href="#add-facility" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-800"><Plus className="size-4" />Add facility</a>} />
    {data.error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">{data.error}</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><p className="text-2xl font-extrabold text-[#0e2946]">{data.facilities.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Facilities listed</p></div><div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><p className="text-2xl font-extrabold text-[#0e2946]">{categories.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Facility types available</p></div><div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><p className="text-2xl font-extrabold text-[#0e2946]">{data.media.filter((item) => item.media_type === "image").length}</p><p className="mt-1 text-xs font-bold text-slate-500">School photos</p></div></div>

    {data.facilities.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{data.facilities.map((item) => { const name = item.custom_name || item.facility?.name || "School facility"; const Icon = facilityIcon(name); const count = photoCount(name); return <WorkspaceCard key={item.id} className="overflow-hidden p-0">
      <div className="relative grid aspect-[16/7] place-items-center bg-[linear-gradient(115deg,#e7f2ec,#eef4f8)]">{data.media.find((media) => media.media_type === "image" && media.url && media.category.toLowerCase().includes(name.toLowerCase().split(" ")[0]))?.url ? <Image src={data.media.find((media) => media.media_type === "image" && media.url && media.category.toLowerCase().includes(name.toLowerCase().split(" ")[0]))!.url!} alt={`${name} at ${school.name}`} fill unoptimized className="object-cover" sizes="(max-width:768px) 100vw, 33vw" /> : <span className="grid size-12 place-items-center rounded-2xl bg-white/80 text-emerald-800"><Icon className="size-6" /></span>}</div>
      <div className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-sm font-extrabold text-[#0e2946]">{name}</h2><p className="mt-1 text-[11px] text-slate-500">{item.branch_id ? branches?.find((branch) => branch.id === item.branch_id)?.name ?? "Campus" : "All campuses"}</p></div><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600"><Check className="size-3 text-emerald-700" />Listed</span></div>
        {item.description && <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{item.description}</p>}<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><a href={`/school/media?category=${encodeURIComponent(name)}`} className="text-xs font-bold text-emerald-800 hover:underline">{count} {count === 1 ? "photo" : "photos"}</a><details className="relative"><summary className="flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-xs font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 [&::-webkit-details-marker]:hidden"><Trash2 className="size-3.5" />Remove</summary><form action={deleteFacility} className="absolute right-0 top-9 z-10 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"><input type="hidden" name="schoolId" value={school.id} /><input type="hidden" name="facilityId" value={item.id} /><p className="text-xs font-semibold text-slate-700">Remove {name} from your profile?</p><Button size="sm" variant="outline" className="mt-2 w-full border-rose-200 text-rose-700">Yes, remove</Button></form></details></div></div>
    </WorkspaceCard>; })}</div> : <div className="mt-5"><EmptyHint icon={MapPinned} title="Show parents what your school offers" description="Add classrooms, learning spaces, transport, sports and other facilities families want to know about." action={<a href="#add-facility" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3.5 text-xs font-extrabold text-white hover:bg-emerald-800"><Plus className="size-4" />Add your first facility</a>} /></div>}

    <WorkspaceCard className="mt-5" ><div id="add-facility" className="scroll-mt-24"><h2 className="text-base font-extrabold text-[#0e2946]">Add a facility</h2><p className="mt-1 text-sm text-slate-500">Choose a facility, campus and optional description.</p><form action={addFacility} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_auto]">
      <input type="hidden" name="schoolId" value={school.id} /><label className="text-xs font-bold text-slate-700">Facility<select name="facilityCode" required defaultValue="" className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="" disabled>Choose a facility</option>{(catalog ?? []).map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-700">Campus<select name="branchId" defaultValue="" className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">All campuses</option>{(branches ?? []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-700 sm:col-span-2 xl:col-span-1">Description <span className="font-medium text-slate-400">(optional)</span><input name="description" maxLength={800} placeholder="A short note for families" className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" /></label>
      <div className="flex items-end"><Button className="w-full sm:w-auto"><Plus className="size-4" />Add facility</Button></div>
    </form></div></WorkspaceCard>
    <p className="mt-3 text-xs leading-5 text-slate-500">To add photos for a facility, use Photos & Videos and choose the matching category. Availability details are not collected yet.</p>
  </>;
}
