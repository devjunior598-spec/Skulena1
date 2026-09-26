"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schoolReviewSchema = z.object({
  schoolId: z.string().uuid(),
  status: z.enum(["under_review", "published", "rejected"]),
  confirm: z.enum(["yes"]).optional(),
});

function returnToAdmin(message: string): never {
  return redirect(`/admin?${message.startsWith("error=") ? message : `notice=${message}`}`);
}

export async function changeSchoolReviewStatus(formData: FormData) {
  const { profile } = await requireAccount();
  if (profile.role !== "admin" && profile.role !== "super_admin") returnToAdmin("error=read_only");

  const parsed = schoolReviewSchema.safeParse({
    schoolId: formData.get("schoolId"),
    status: formData.get("status"),
    confirm: formData.get("confirm") || undefined,
  });
  if (!parsed.success) returnToAdmin("error=invalid_action");
  const { schoolId, status, confirm } = parsed.data;
  if (status !== "under_review" && confirm !== "yes") returnToAdmin("error=confirmation_required");

  const supabase = await createClient();
  if (!supabase) returnToAdmin("error=unavailable");

  const [schoolResult, branchResult, levelsResult, curriculaResult] = await Promise.all([
    supabase.from("schools").select("slug, status, description").eq("id", schoolId).maybeSingle(),
    supabase.from("school_branches").select("address_line").eq("school_id", schoolId).eq("is_main", true).maybeSingle(),
    supabase.from("school_levels").select("level_id").eq("school_id", schoolId),
    supabase.from("school_curricula").select("curriculum_id").eq("school_id", schoolId),
  ]);
  if (schoolResult.error || branchResult.error || levelsResult.error || curriculaResult.error || !schoolResult.data) returnToAdmin("error=school_not_found");
  const school = schoolResult.data;

  const canTransition = school.status === "submitted"
    ? status === "under_review" || status === "published" || status === "rejected"
    : school.status === "under_review" && (status === "published" || status === "rejected");
  if (!canTransition) returnToAdmin("error=already_changed");
  if (status === "published" && (!school.description?.trim() || !branchResult.data?.address_line?.trim() || !levelsResult.data?.length || !curriculaResult.data?.length)) returnToAdmin("error=details_incomplete");

  const { error } = await supabase.rpc("set_school_status", {
    target_school_id: schoolId,
    new_status: status,
  });
  if (error) {
    console.error("[admin-review] school status update failed", { code: error.code ?? "unknown" });
    returnToAdmin("error=update_failed");
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/schools");
  revalidatePath(`/school/${school.slug}`);
  returnToAdmin(status);
}
