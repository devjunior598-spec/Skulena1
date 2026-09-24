"use server";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { documentUploadSchema, mediaUploadSchema } from "@/lib/validation/school";

export async function registerMediaRecord(input: unknown) {
  const { user } = await requireAccount(["school_owner", "school_staff"]); const parsed = mediaUploadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid upload." };
  const value = parsed.data; const limit = value.mediaType === "image" ? 10485760 : 104857600;
  if (value.byteSize > limit) return { error: value.mediaType === "image" ? "Images must be 10 MB or smaller." : "Videos must be 100 MB or smaller." };
  const supabase = (await createClient())!;
  const { error } = await supabase.from("school_media").insert({ school_id: value.schoolId, category: value.category, media_type: value.mediaType, storage_path: value.storagePath, mime_type: value.mimeType, byte_size: value.byteSize, caption: value.caption || null, uploaded_by: user.id });
  if (error) return { error: "The file uploaded, but its media record could not be saved." };
  revalidatePath("/school/media"); return { success: true as const };
}

export async function registerDocumentRecord(input: unknown) {
  const { user } = await requireAccount(["school_owner", "school_staff"]); const parsed = documentUploadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid document." };
  const value = parsed.data; const supabase = (await createClient())!;
  const { error } = await supabase.from("school_documents").insert({ school_id: value.schoolId, document_type: value.documentType, title: value.title, storage_path: value.storagePath, mime_type: value.mimeType, byte_size: value.byteSize, uploaded_by: user.id });
  if (error) return { error: "The document uploaded, but its private record could not be saved." };
  revalidatePath("/school/verification"); return { success: true as const };
}
