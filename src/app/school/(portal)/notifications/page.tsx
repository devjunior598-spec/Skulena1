import { Bell, CheckCircle2 } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { EmptyHint, WorkspaceCard } from "@/components/school/workspace-ui";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { markSchoolNotificationRead } from "@/app/school/(portal)/workspace-actions";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { supabase, user } = await getManagedSchool();
  const { data, error } = await supabase.from("notifications").select("id, notification_type, title, body, href, read_at, created_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(50);
  const notifications = data ?? [];
  return <>
    <PageHeading eyebrow="Updates" title="Notifications" description="Important updates for your school account and profile." />
    {error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">We couldn’t load your notifications. Refresh the page to try again.</p>}
    {notifications.length ? <div className="mt-5 space-y-2">{notifications.map((notification) => <WorkspaceCard key={notification.id} className={`flex flex-col gap-3 sm:flex-row sm:items-center ${notification.read_at ? "" : "border-emerald-200 bg-emerald-50/30"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${notification.read_at ? "bg-slate-50 text-slate-500" : "bg-emerald-100 text-emerald-800"}`}>{notification.read_at ? <CheckCircle2 className="size-5" /> : <Bell className="size-5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-extrabold text-[#0e2946]">{notification.title}</h2>{!notification.read_at && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-900">New</span>}</div><p className="mt-1 text-sm leading-5 text-slate-600">{notification.body}</p><time className="mt-2 block text-[10px] font-semibold text-slate-400">{new Date(notification.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</time></div>{!notification.read_at && <form action={markSchoolNotificationRead}><input type="hidden" name="notificationId" value={notification.id} /><Button size="sm" variant="outline">Open update</Button></form>}</WorkspaceCard>)}</div> : <div className="mt-5"><EmptyHint icon={Bell} title="You’re all caught up" description="Updates about your school account and profile will show here." /></div>}
  </>;
}
