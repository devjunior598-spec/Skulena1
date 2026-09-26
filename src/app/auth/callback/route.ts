import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth";
import type { Role } from "@/types/domain";

function safeNext(value: string | null, origin: string) {
  if (!value) return null;
  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = safeNext(request.nextUrl.searchParams.get("next"), request.nextUrl.origin);
  const supabase = await createClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
  if (requestedNext) return NextResponse.redirect(new URL(requestedNext, request.url));
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  if (!profile) return NextResponse.redirect(new URL("/sign-in?error=profile", request.url));
  return NextResponse.redirect(new URL(roleHome((profile?.role as Role | undefined) ?? null), request.url));
}
