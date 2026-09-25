import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { School, VerificationLevel } from "@/data/schools";

function relationName(value: unknown) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return relationName(value[0]);
  return "name" in value && typeof value.name === "string" ? value.name : null;
}

export async function getPublicSchools(): Promise<School[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: rows, error } = await supabase.from("public_school_profiles").select("*").order("published_at", { ascending: false }).limit(100);
  if (error || !rows?.length) return [];
  const ids = rows.map((row) => row.id);
  const [{ data: branches }, { data: levels }, { data: curricula }, { data: facilities }, { data: fees }, { data: verification }, { data: media }] = await Promise.all([
    supabase.from("school_branches").select("school_id, state, city, area, address_line, is_main").in("school_id", ids),
    supabase.from("school_levels").select("school_id, levels(name)").in("school_id", ids),
    supabase.from("school_curricula").select("school_id, curricula(name)").in("school_id", ids),
    supabase.from("school_facilities").select("school_id, facilities(name)").in("school_id", ids),
    supabase.from("school_fees").select("school_id, amount").in("school_id", ids),
    supabase.from("public_verification_records").select("school_id, method").in("school_id", ids),
    supabase.from("school_media").select("id, school_id, category, media_type, storage_path, caption, alt_text, is_cover, sort_order").in("school_id", ids).eq("moderation_status", "approved").order("sort_order"),
  ]);
  const paths = (media ?? []).map((item) => item.storage_path);
  const signed = paths.length ? await supabase.storage.from("school-media").createSignedUrls(paths, 3600) : { data: [] };
  const urls = new Map((signed.data ?? []).map((item) => [item.path, item.signedUrl]));
  return rows.map((row) => {
    const branch = (branches ?? []).find((item) => item.school_id === row.id && item.is_main) ?? (branches ?? []).find((item) => item.school_id === row.id);
    const amounts = (fees ?? []).filter((item) => item.school_id === row.id).map((item) => Number(item.amount));
    const schoolMedia = (media ?? []).filter((item) => item.school_id === row.id && item.media_type === "image");
    const profileMedia = schoolMedia.flatMap((item) => {
      const src = urls.get(item.storage_path);
      return src ? [{ id: item.id, src, category: item.category, caption: item.caption || "", alt: item.alt_text || `${row.name} ${item.category.toLowerCase()}` }] : [];
    });
    const cover = schoolMedia.find((item) => item.is_cover) ?? schoolMedia[0];
    const methods = (verification ?? []).filter((item) => item.school_id === row.id).map((item) => item.method);
    const verificationLevel: VerificationLevel = methods.includes("physically_verified") ? "physically-verified" : methods.includes("document_verified") ? "document-verified" : "school-provided";
    const structure = row.structure === "day_and_boarding" ? "Day & Boarding" : row.structure === "boarding" ? "Day & Boarding" : "Day";
    return { databaseId: row.id, slug: row.slug, name: row.name, shortName: row.short_name || row.name, location: [branch?.area, branch?.city, branch?.state].filter(Boolean).join(", ") || "Location available on request", city: branch?.city || "", distance: "", levels: (levels ?? []).filter((item) => item.school_id === row.id).map((item) => relationName(item.levels)).filter((value): value is string => Boolean(value)), curriculum: (curricula ?? []).filter((item) => item.school_id === row.id).map((item) => relationName(item.curricula)).filter((value): value is string => Boolean(value)), type: structure, admissionStatus: row.admission_status, admissionDescription: row.admission_description || undefined, feeFrom: amounts.length ? Math.min(...amounts) : 0, feeTo: amounts.length ? Math.max(...amounts) : 0, rating: 0, reviewCount: 0, classSize: 0, verification: verificationLevel, image: cover ? urls.get(cover.storage_path) ?? null : null, images: profileMedia.map((item) => item.src), media: profileMedia, description: row.description || "School profile", facilities: (facilities ?? []).filter((item) => item.school_id === row.id).map((item) => relationName(item.facilities)).filter((value): value is string => Boolean(value)), tags: [], } satisfies School;
  });
}

export async function getPublicSchoolBySlug(slug: string) { return (await getPublicSchools()).find((school) => school.slug === slug); }
