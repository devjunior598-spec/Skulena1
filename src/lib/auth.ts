import "server-only";

import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import { createClient } from "@/lib/supabase/server";

export function roleHome(role: Role | null | undefined) {
  if (role === "parent") return "/parent";
  if (role === "school_owner" || role === "school_staff") return "/school/dashboard";
  if (["inspector", "moderator", "admin", "super_admin"].includes(role ?? "")) return "/admin";
  return "/";
}

export async function getCurrentAccount() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("id, role, full_name, avatar_url").eq("id", userId).maybeSingle();
  return { user: { id: userId, email: claims.email }, profile: profile as { id: string; role: Role; full_name: string; avatar_url: string | null } | null };
}

export async function requireAccount(allowedRoles?: Role[]) {
  const account = await getCurrentAccount();
  if (!account?.profile) redirect("/sign-in");
  if (allowedRoles && !allowedRoles.includes(account.profile.role)) redirect(roleHome(account.profile.role));
  return account as { user: NonNullable<typeof account>["user"]; profile: NonNullable<NonNullable<typeof account>["profile"]> };
}
