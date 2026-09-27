import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAccount();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Document service unavailable" }, { status: 503 });
  const { data: document } = await supabase.from("admission_documents").select("id, storage_path").eq("id", id).maybeSingle();
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  const { error: auditError } = await supabase.rpc("record_admission_document_access", { target_document_id: document.id });
  if (auditError) return NextResponse.json({ error: "Document access could not be authorized" }, { status: 403, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  const { data: signed, error } = await supabase.storage.from("admission-documents").createSignedUrl(document.storage_path, 60);
  if (error || !signed?.signedUrl) return NextResponse.json({ error: "Document is temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
