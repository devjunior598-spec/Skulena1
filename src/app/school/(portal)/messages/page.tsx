import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { PageHeading } from "@/components/portal/page-heading";
import { getManagedSchool } from "@/lib/schools/managed-school";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admissions messages" };

export default async function SchoolMessagesPage() {
  const { school, supabase, membership } = await getManagedSchool();
  if (!school) return <PageHeading title="Messages" description="Select your school to view admissions conversations." />;
  if (!membership || !["owner", "administrator", "admissions"].includes(membership.role)) return <PageHeading title="Messages" description="Admissions conversations are available to the school owner, administrators and admissions team." />;
  const { data: messages, error } = await supabase.from("admission_messages").select("id, application_id, parent_id, sender_id, body, created_at").eq("school_id", school.id).order("created_at", { ascending: false }).limit(200);
  const appIds = [...new Set((messages ?? []).map((item) => item.application_id))];
  const parentIds = [...new Set((messages ?? []).map((item) => item.parent_id))];
  const [{ data: apps }, { data: parents }] = await Promise.all([
    appIds.length ? supabase.from("admission_applications").select("id, application_number, class_name, child_id").in("id", appIds) : Promise.resolve({ data: [] }),
    parentIds.length ? supabase.from("profiles").select("id, full_name").in("id", parentIds) : Promise.resolve({ data: [] }),
  ]);
  const childIds = [...new Set((apps ?? []).map((item) => item.child_id))];
  const { data: children } = childIds.length ? await supabase.from("children").select("id, first_name, last_name").in("id", childIds) : { data: [] };
  return <><PageHeading eyebrow={school.name} title="Admissions messages" description="Parent conversations stay attached to their application. Admissions team access is permission-checked." />{error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">We couldn’t load conversations. Check the admissions migration and access, then refresh.</p>}<div className="mt-6">{messages?.length ? <ul className="space-y-3">{messages.map((message) => { const app = apps?.find((item) => item.id === message.application_id); const parent = parents?.find((item) => item.id === message.parent_id); const child = children?.find((item) => item.id === app?.child_id); return <li key={message.id}><Link href={`/school/applications/${message.application_id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-300"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-extrabold text-[#0e2946]">{parent?.full_name || "Parent"} · {child ? `${child.first_name} ${child.last_name}` : "Child"}</h2><time className="text-xs text-slate-500">{new Date(message.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</time></div><p className="mt-1 text-xs text-slate-500">{app?.application_number ?? "Application"} · {app?.class_name ?? ""} · {message.sender_id === message.parent_id ? "Parent" : "School"}</p><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.body}</p><span className="mt-3 inline-block text-xs font-bold text-emerald-800">Open application conversation →</span></Link></li>; })}</ul> : <EmptyState icon={MessageSquareText} title="No family conversations yet" description="Messages will appear here when a parent or your admissions team writes about a submitted application." />}</div></>;
}
