import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { PageHeading } from "@/components/portal/page-heading";
import { createClient } from "@/lib/supabase/server";
import { requireAccount } from "@/lib/auth";

export default async function ParentMessagesPage() {
  const { user } = await requireAccount(["parent"]);
  const supabase = await createClient();
  if (!supabase) return <PageHeading title="Messages" description="Application conversations will appear here." />;
  const { data: messages, error } = await supabase.from("admission_messages").select("id, application_id, sender_id, body, created_at, school_id").eq("parent_id", user.id).order("created_at", { ascending: false }).limit(200);
  const appIds = [...new Set((messages ?? []).map((m) => m.application_id))];
  const schoolIds = [...new Set((messages ?? []).map((m) => m.school_id))];
  const [{ data: apps }, { data: schools }] = await Promise.all([
    appIds.length ? supabase.from("admission_applications").select("id, application_number, class_name").in("id", appIds) : Promise.resolve({ data: [] }),
    schoolIds.length ? supabase.from("public_school_profiles").select("id, name").in("id", schoolIds) : Promise.resolve({ data: [] }),
  ]);
  return <><PageHeading eyebrow="Family workspace" title="Messages" description="Secure conversations are kept with the admission application they relate to." />{error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">We couldn’t load messages. Please refresh the page.</p>}<div className="mt-6">{messages?.length ? <ul className="space-y-3">{messages.map((message) => { const app = apps?.find((a) => a.id === message.application_id); const school = schools?.find((s) => s.id === message.school_id); return <li key={message.id}><Link href={`/parent/applications/${message.application_id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-300"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-extrabold text-[#0e2946]">{school?.name ?? "School"}</h2><time className="text-xs text-slate-500">{new Date(message.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</time></div><p className="mt-1 text-xs text-slate-500">{app?.application_number ?? "Application"} · {app?.class_name ?? ""} · {message.sender_id === user.id ? "You" : "School"}</p><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.body}</p><span className="mt-3 inline-block text-xs font-bold text-emerald-800">Open conversation →</span></Link></li>; })}</ul> : <EmptyState icon={MessageSquareText} title="No application messages yet" description="Messages from school admissions teams will be tied to the relevant application here." />}</div></>;
}
