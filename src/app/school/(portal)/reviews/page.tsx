import { Star, MessageSquareText } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyHint, StatusPill, WorkspaceCard, WorkspaceFeedback, type WorkspaceSearchParams } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { getSchoolWorkspaceData } from "@/lib/schools/workspace";
import { respondToReview } from "@/app/school/(portal)/workspace-actions";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews" };
type PageProps = { searchParams?: WorkspaceSearchParams };

export default async function ReviewsPage({ searchParams }: PageProps) {
  const { school, supabase } = await getManagedSchool();
  if (!school) return <PageHeading eyebrow="Communication" title="Reviews" description="Set up your school profile first to manage parent reviews." />;
  const data = await getSchoolWorkspaceData(supabase, school.id);
  return <>
    <WorkspaceFeedback searchParams={searchParams} />
    <PageHeading eyebrow="Communication" title="Reviews" description="Read the feedback families have shared about your school and respond with care." />
    {data.error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">{data.error}</p>}
    {data.reviews.length ? <div className="mt-6 space-y-3">{data.reviews.map((review) => <WorkspaceCard key={review.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-current" : "text-slate-200"}`} />)}<span className="ml-1 text-xs font-extrabold text-slate-600">{review.rating}/5</span></div><h2 className="mt-2 text-sm font-extrabold text-[#0e2946]">{review.title || "Parent review"}</h2><p className="mt-1 text-[11px] font-semibold text-slate-400">{new Date(review.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p></div><StatusPill value={review.status} /></div><p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{review.body}</p>
      {review.response ? <div className="mt-4 rounded-xl bg-sky-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-900">Your school’s reply</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{review.response.body}</p><p className="mt-2 text-[10px] text-slate-500">{new Date(review.response.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p></div>
        : review.status === "published" ? <details className="mt-4"><summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50 [&::-webkit-details-marker]:hidden"><MessageSquareText className="size-4" />Reply to this review</summary><form action={respondToReview} className="mt-3 rounded-xl bg-slate-50 p-4"><input type="hidden" name="schoolId" value={school.id} /><input type="hidden" name="reviewId" value={review.id} /><label className="block text-xs font-bold text-slate-700">Your reply<textarea name="body" required minLength={2} maxLength={4000} rows={4} placeholder="Write a thoughtful response to this family." className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label><Button size="sm" className="mt-3">Post reply</Button></form></details>
        : <p className="mt-4 text-xs text-slate-500">This review will be available to reply to after it has been published.</p>}
    </WorkspaceCard>)}</div> : <div className="mt-6"><EmptyHint icon={MessageSquareText} title="No parent reviews yet" description="When families share a review of your school, it will appear here. You can reply to published reviews from this page." /></div>}
  </>;
}
