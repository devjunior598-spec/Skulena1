import Image from "next/image";
import { Images, Plus, Video } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyHint, WorkspaceFeedback, type WorkspaceSearchParams } from "@/components/school/workspace-ui";
import { MediaUploader } from "@/components/school/media-uploader";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData } from "@/lib/schools/workspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Photos & videos" };
type PageProps = { searchParams?: WorkspaceSearchParams };
const categories = ["School logo", "Campus", "Classrooms", "Library", "ICT Laboratory", "Science Laboratory", "Sports", "Playground", "Transportation", "Dining", "Kitchen", "Sick Bay", "Toilets", "Boarding", "Security"];

export default async function SchoolMediaPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const { school, supabase } = await getManagedSchool();
  if (!school) return <PageHeading eyebrow="Your school" title="Photos & videos" description="Set up your school profile first, then share photos and videos with families." />;
  const data = await getSchoolWorkspaceData(supabase, school.id);
  const photos = data.media.filter((item) => item.media_type === "image");
  const videos = data.media.filter((item) => item.media_type === "video");
  return <>
    <WorkspaceFeedback searchParams={searchParams} />
    <PageHeading eyebrow="Your school" title="Photos & videos" description="Give parents a real look inside your school, from classrooms to the places learners play and grow." action={<a href="#upload-media" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white hover:bg-emerald-800"><Plus className="size-4" />Upload photos or videos</a>} />
    {data.error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">{data.error}</p>}
    <div className="mt-5 flex flex-wrap gap-3"><div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"><Images className="size-4 text-emerald-700" /><span className="text-sm font-extrabold text-[#0e2946]">{photos.length}</span><span className="text-xs font-semibold text-slate-500">photos</span></div><div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"><Video className="size-4 text-sky-700" /><span className="text-sm font-extrabold text-[#0e2946]">{videos.length}</span><span className="text-xs font-semibold text-slate-500">videos</span></div><div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"><span className="size-2 rounded-full bg-amber-500" /><span className="text-sm font-extrabold text-[#0e2946]">{data.media.filter((item) => item.moderation_status === "pending").length}</span><span className="text-xs font-semibold text-slate-500">under review</span></div></div>

    <section className="mt-6"><div className="mb-3"><h2 className="text-base font-extrabold text-[#0e2946]">Your school spaces</h2><p className="mt-1 text-xs text-slate-500">Choose a category to add a new photo or video.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{categories.map((category) => { const matches = data.media.filter((item) => item.category.toLowerCase() === category.toLowerCase()); const thumbnail = matches.find((item) => item.media_type === "image" && item.url); return <a key={category} href={`/school/media?category=${encodeURIComponent(category)}#upload-media`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><div className="relative aspect-[16/9] bg-[linear-gradient(115deg,#e4f0e9,#edf4f8)]">{thumbnail?.url ? <Image src={thumbnail.url} alt={`${category} at ${school.name}`} fill unoptimized className="object-cover" sizes="(max-width:640px) 50vw, 25vw" /> : <div className="absolute inset-0 grid place-items-center"><Images className="size-6 text-emerald-800/60" /></div>}<span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-extrabold text-slate-700 backdrop-blur">{matches.length}</span></div><div className="flex min-h-11 items-center justify-between gap-2 px-3"><span className="truncate text-xs font-extrabold text-[#0e2946]">{category}</span><span className="shrink-0 text-[10px] font-extrabold text-emerald-800 group-hover:underline">Add media</span></div></a>; })}</div></section>

    {!data.media.length && <div className="mt-5"><EmptyHint icon={Images} title="Give families a look inside your school" description="Add a classroom, library or school event photo. Your files appear here immediately, before they are shared on your public profile." action={<a href="#upload-media" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3.5 text-xs font-extrabold text-white hover:bg-emerald-800"><Plus className="size-4" />Add your first photo</a>} /></div>}
    <div className="mt-6"><MediaUploader schoolId={school.id} initialCategory={category} /></div>
  </>;
}
