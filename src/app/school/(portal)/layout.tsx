import { SchoolWorkspaceShell } from "@/components/school/workspace-shell";
import { getManagedSchool } from "@/lib/schools/managed-school";
import { SCHOOL_LOGO_CATEGORY } from "@/types/domain";

export default async function SchoolPortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, supabase, school, schoolOptions } = await getManagedSchool();
  const logoPromise = school ? (async () => {
    const { data } = await supabase.from("school_media").select("storage_path").eq("school_id", school.id).eq("category", SCHOOL_LOGO_CATEGORY).eq("media_type", "image").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data?.storage_path) return null;
    const { data: signed } = await supabase.storage.from("school-media").createSignedUrl(data.storage_path, 1800);
    return signed?.signedUrl ?? null;
  })() : Promise.resolve(null);
  const notificationPromise = supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null).then(({ count }) => count ?? 0);
  const [schoolLogo, notifications] = await Promise.all([logoPromise, notificationPromise]);
  return <SchoolWorkspaceShell schoolName={school?.name ?? null} schoolStatus={school?.status ?? null} schoolLogo={schoolLogo} currentSchoolId={school?.id} schoolOptions={schoolOptions} fullName={profile.full_name} avatarUrl={profile.avatar_url} email={user.email ?? undefined} notifications={notifications}>{children}</SchoolWorkspaceShell>;
}
