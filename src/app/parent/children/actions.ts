"use server";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { childSchema, type ChildValues } from "@/lib/validation/child";

export async function createChild(values: ChildValues) {
  const { user } = await requireAccount(["parent"]);
  const parsed = childSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const supabase = await createClient();
  const { error } = await supabase!.from("children").insert({ parent_id: user.id, first_name: parsed.data.firstName, last_name: parsed.data.lastName || null, date_of_birth: parsed.data.dateOfBirth || null, current_level: parsed.data.currentLevel || null, target_level: parsed.data.targetLevel || null, notes: parsed.data.notes || null });
  if (error) return { error: "We couldn’t save this child profile." };
  revalidatePath("/parent/children");
  return { success: true as const };
}
