"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Plus, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { registerMediaRecord } from "@/app/school/(portal)/media/actions";
import { deleteSchoolMedia, moveSchoolMedia, setSchoolMediaCover, updateSchoolMedia } from "@/app/school/(portal)/workspace-actions";
import { mediaCategories, SCHOOL_LOGO_CATEGORY } from "@/types/domain";

const mimeTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"] as const;
const extensionByMime = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;
const maxFilesPerUpload = 12;

type MediaEntry = {
  id: number;
  category: string;
  customCategory: string;
  caption: string;
  file: File | null;
  previewUrl: string;
};

type UploadedMedia = {
  id: string;
  category: string;
  mediaType: "image" | "video";
  caption: string;
  src: string;
  moderationStatus: string;
  isCover: boolean;
  sortOrder: number;
};

type UploadedMediaRecord = {
  id: string;
  category: string;
  media_type: "image" | "video";
  storage_path: string;
  caption: string | null;
  moderation_status: string;
  is_cover: boolean;
  sort_order: number;
};

function emptyEntry(id: number, category = "Campus"): MediaEntry {
  return { id, category, customCategory: "", caption: "", file: null, previewUrl: "" };
}

function mediaStatus(status: string) {
  if (status === "pending") return "Under review";
  if (status === "approved") return "Published";
  if (status === "rejected") return "Needs changes";
  return status;
}

export function MediaUploader({ schoolId, initialCategory = "Campus", onPendingCountChange }: { schoolId: string; initialCategory?: string; onPendingCountChange?: (count: number) => void }) {
  const router = useRouter();
  const defaultCategory = mediaCategories.includes(initialCategory as typeof mediaCategories[number]) ? initialCategory : "Campus";
  const nextEntryId = useRef(1);
  const previewUrls = useRef(new Map<number, string>());
  const [entries, setEntries] = useState<MediaEntry[]>([emptyEntry(0, defaultCategory)]);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");

  const loadUploadedMedia = useCallback(async (): Promise<UploadedMedia[] | null> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("school_media")
        .select("id, category, media_type, storage_path, caption, moderation_status, is_cover, sort_order")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(48);
      if (error || !data) return null;

      const records = data as UploadedMediaRecord[];
      const paths = records.map((item: UploadedMediaRecord) => item.storage_path);
      const { data: signedUrls } = paths.length ? await supabase.storage.from("school-media").createSignedUrls(paths, 3600) : { data: [] };
      const signedUrlRecords = (signedUrls ?? []) as Array<{ path: string | null; signedUrl: string | null }>;
      const urlByPath = new Map(signedUrlRecords.map((item) => [item.path, item.signedUrl]));
      return records.flatMap((item: UploadedMediaRecord) => {
        const src = urlByPath.get(item.storage_path);
        if (!src) return [];
        return [{ id: item.id, category: item.category, mediaType: item.media_type, caption: item.caption || "", src, moderationStatus: String(item.moderation_status), isCover: item.is_cover, sortOrder: item.sort_order }];
      });
    } catch {
      return null;
    }
  }, [schoolId]);

  useEffect(() => {
    let active = true;
    void loadUploadedMedia().then((result) => {
      if (!active) return;
      if (result) { setUploadedMedia(result); setGalleryError(false); }
      else setGalleryError(true);
      setGalleryLoading(false);
    });
    return () => { active = false; };
  }, [loadUploadedMedia]);
  useEffect(() => () => { previewUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  function updateEntry(id: number, update: Partial<MediaEntry>) {
    const next = entries.map((entry) => entry.id === id ? { ...entry, ...update } : entry);
    setEntries(next);
    if ("file" in update) onPendingCountChange?.(next.filter((entry) => entry.file).length);
    setMessage("");
  }

  function chooseFile(id: number, file: File | null) {
    const previousUrl = previewUrls.current.get(id);
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    previewUrls.current.delete(id);
    const previewUrl = file ? URL.createObjectURL(file) : "";
    if (previewUrl) previewUrls.current.set(id, previewUrl);
    updateEntry(id, { file, previewUrl });
  }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const available = maxFilesPerUpload - entries.filter((entry) => entry.file).length;
    const selected = incoming.slice(0, Math.max(0, available));
    const next = [...entries];
    for (const file of selected) {
      let index = next.findIndex((entry) => !entry.file);
      if (index < 0 && next.length < maxFilesPerUpload) {
        next.push(emptyEntry(nextEntryId.current++, defaultCategory));
        index = next.length - 1;
      }
      if (index < 0) break;
      const entry = next[index];
      const previousUrl = previewUrls.current.get(entry.id);
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.set(entry.id, previewUrl);
      next[index] = { ...entry, file, previewUrl };
    }
    setEntries(next);
    onPendingCountChange?.(next.filter((entry) => entry.file).length);
    setMessage(incoming.length > selected.length ? `You can add up to ${maxFilesPerUpload} files at once. The extra files were not added.` : "");
  }

  function addEntry() {
    if (entries.length >= maxFilesPerUpload) return;
    setEntries((current) => [...current, emptyEntry(nextEntryId.current++)]);
    setMessage("");
  }

  function removeEntry(id: number) {
    const next = entries.length === 1 ? [emptyEntry(nextEntryId.current++, defaultCategory)] : entries.filter((entry) => entry.id !== id);
    const previousUrl = previewUrls.current.get(id);
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    previewUrls.current.delete(id);
    setEntries(next);
    onPendingCountChange?.(next.filter((entry) => entry.file).length);
    setMessage("");
  }

  async function upload() {
    const incomplete = entries.find((entry) => !entry.file);
    if (incomplete) { setMessage(`Choose a photo or video for image ${entries.indexOf(incomplete) + 1}, or remove that entry.`); return; }

    for (const [index, entry] of entries.entries()) {
      const category = entry.category === "Other" ? entry.customCategory.trim() : entry.category;
      if (category.length < 2 || category.length > 80) { setMessage(`Add a category name for image ${index + 1} (2–80 characters).`); return; }
      const file = entry.file!;
      if (!mimeTypes.includes(file.type as typeof mimeTypes[number])) { setMessage(`${file.name}: use JPEG, PNG or WebP images, or MP4/WebM videos.`); return; }
      if (category === SCHOOL_LOGO_CATEGORY && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) { setMessage("A school logo must be an image smaller than 5 MB."); return; }
      const limit = file.type.startsWith("image/") ? 10485760 : 104857600;
      if (file.size > limit) { setMessage(`${file.name} is too large. Images must be 10 MB or smaller; videos 100 MB or smaller.`); return; }
    }

    setBusy(true);
    setMessage("");
    let completed = 0;
    let failure = "";
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        failure = "Sign in again before uploading.";
      } else {
        for (const [index, entry] of entries.entries()) {
          const file = entry.file!;
          const category = entry.category === "Other" ? entry.customCategory.trim() : entry.category;
          setProgress(`Uploading ${index + 1} of ${entries.length}: ${file.name}`);
          const extension = extensionByMime[file.type as keyof typeof extensionByMime];
          const storagePath = `${schoolId}/${user.id}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage.from("school-media").upload(storagePath, file, { contentType: file.type, upsert: false });
          if (uploadError) { failure = `${file.name} could not be uploaded. Please try again.`; break; }

          const mediaType = file.type.startsWith("image/") ? "image" : "video";
          const result = await registerMediaRecord({ schoolId, category, caption: entry.caption.trim(), mediaType, storagePath, mimeType: file.type, byteSize: file.size });
          if (result.error) {
            await supabase.storage.from("school-media").remove([storagePath]);
            failure = `${file.name}: ${result.error}`;
            break;
          }
          completed += 1;
        }
      }
    } catch {
      failure = "The upload was interrupted. Any completed files are saved; try the remaining entries again.";
    }

    if (completed) {
      const saved = entries.slice(0, completed);
      const immediatePreviews: UploadedMedia[] = saved.flatMap((entry) => {
        if (!entry.file || !entry.previewUrl) return [];
        return [{ id: `local-${entry.id}`, category: entry.category === "Other" ? entry.customCategory.trim() : entry.category, mediaType: entry.file.type.startsWith("video/") ? "video" : "image", caption: entry.caption.trim(), src: entry.previewUrl, moderationStatus: "pending", isCover: false, sortOrder: 0 }];
      });
      setUploadedMedia((current) => [...immediatePreviews, ...current]);
      setGalleryLoading(false);
      setGalleryError(false);
      const persistedMedia = await loadUploadedMedia();
      if (persistedMedia) setUploadedMedia(persistedMedia);
      const remaining = entries.slice(completed);
      setEntries(remaining.length ? remaining : [emptyEntry(nextEntryId.current++, defaultCategory)]);
      onPendingCountChange?.(remaining.filter((entry) => entry.file).length);
      await loadUploadedMedia();
      router.refresh();
    }
    setBusy(false);
    setProgress("");
    if (failure) {
      setMessage(completed ? `${completed} saved for review. ${entries.length - completed} remain in the list. ${failure}` : failure);
    } else {
      setMessage(`${completed} ${completed === 1 ? "file" : "files"} added for review. Review them below; they’ll appear publicly after approval.`);
    }
  }

  return (
    <div id="upload-media" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <ImagePlus className="size-5 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 className="font-extrabold text-[#0e2946]">Add school photos and videos</h2>
          <p className="mt-1 text-sm text-slate-600">Choose a category and file for each entry. Preview everything here before continuing.</p>
        </div>
      </div>

      <label onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false); }} onDrop={(event) => { event.preventDefault(); setDragActive(false); addFiles(event.dataTransfer.files); }} className={`mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-4 text-center transition focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 ${dragActive ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/40"}`}>
        <span className="text-sm font-extrabold text-[#0e2946]">Drop photos or videos here</span><span className="mt-1 text-xs text-slate-500">or browse files from your device</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="sr-only" aria-label="Browse photos and videos to upload" onChange={(event) => { if (event.currentTarget.files) addFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
      </label>

      <div className="mt-5 space-y-4">
        {entries.map((entry, index) => <fieldset key={entry.id} disabled={busy} className="rounded-xl border border-slate-200 bg-white p-4">
          <legend className="px-2 text-sm font-extrabold text-[#0e2946]">Media {index + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Category
              <select value={entry.category} onChange={(event) => updateEntry(entry.id, { category: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3">
                {mediaCategories.map((category) => <option key={category} value={category}>{category === "3D Renderings" ? "3D school designs / renderings" : category === "Other" ? "Something else" : category}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">Choose an image or video
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => chooseFile(entry.id, event.currentTarget.files?.[0] ?? null)} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold file:text-emerald-800" />
            </label>
          </div>
          {entry.category === "Other" && <label className="mt-4 block text-sm font-bold text-slate-700">Name this category
            <input value={entry.customCategory} onChange={(event) => updateEntry(entry.id, { customCategory: event.target.value })} maxLength={80} placeholder="e.g. Art room or school events" className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 sm:max-w-md" />
          </label>}
          {entry.category === "3D Renderings" && <p className="mt-3 rounded-xl bg-violet-50 p-3 text-sm leading-6 text-violet-950">Upload a rendered image of a planned campus, building or classroom as JPEG, PNG or WebP.</p>}
          {entry.file && <>
            <p className="mt-3 truncate text-xs font-semibold text-slate-600">Selected: {entry.file.name} · {(entry.file.size / 1048576).toFixed(1)} MB</p>
            <div className="mt-3 max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <p className="bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">Preview · {entry.category === "Other" ? (entry.customCategory || "Other") : entry.category}</p>
              {entry.file.type.startsWith("video/") ? <video src={entry.previewUrl} controls playsInline preload="metadata" className="max-h-[420px] w-full bg-black object-contain" /> : <Image src={entry.previewUrl} alt={entry.caption || `${entry.category} preview`} width={960} height={640} unoptimized className="max-h-[420px] w-full object-contain" />}
            </div>
          </>}
          <label className="mt-4 block text-sm font-bold text-slate-700">Caption <span className="font-medium text-slate-500">(optional)</span>
            <input value={entry.caption} onChange={(event) => updateEntry(entry.id, { caption: event.target.value })} maxLength={300} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3" />
          </label>
          {(entries.length > 1 || entry.file) && <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="mt-3 text-slate-600"><X className="size-4" />Remove item</Button>}
        </fieldset>)}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={addEntry} disabled={busy || entries.length >= maxFilesPerUpload}><Plus className="size-4" />Add another image or video</Button>
        <Button type="button" onClick={upload} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{busy ? "Uploading…" : `Upload ${entries.length} ${entries.length === 1 ? "item" : "items"} for review`}</Button>
      </div>
      {progress && <p role="status" aria-live="polite" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><LoaderCircle className="size-4 animate-spin" />{progress}</p>}
      {message && <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold text-slate-600">{message}</p>}
      <p className="mt-3 text-xs leading-5 text-slate-500">Images: JPEG, PNG or WebP, up to 10 MB each. Videos: MP4 or WebM, up to 100 MB each. Uploaded items stay in your review gallery and appear publicly after approval.</p>

      <section aria-labelledby="school-media-review" className="mt-7 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="school-media-review" className="text-lg font-extrabold text-[#0e2946]">Review your uploaded media</h3>
          {uploadedMedia.length > 0 && <p className="text-xs font-semibold text-slate-500">{uploadedMedia.length} {uploadedMedia.length === 1 ? "item" : "items"}</p>}
        </div>
        {uploadedMedia.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uploadedMedia.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {item.mediaType === "video" ? <video src={item.src} controls playsInline preload="metadata" className="aspect-[4/3] w-full bg-black object-contain" aria-label={item.caption || `${item.category} video`} /> : <div className="relative aspect-[4/3] bg-slate-100"><Image src={item.src} alt={item.caption || `${item.category} photo`} fill unoptimized className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" /></div>}
            <div className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-extrabold text-[#0e2946]">{item.category}</h4><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.moderationStatus === "approved" ? "bg-emerald-50 text-emerald-800" : item.moderationStatus === "rejected" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900"}`}>{mediaStatus(item.moderationStatus)}</span></div>
              {item.caption && <p className="mt-1 text-sm text-slate-600">{item.caption}</p>}
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">{item.mediaType === "video" && <Video className="size-3.5" aria-hidden="true" />}{item.mediaType === "video" ? "Video" : "Photo"}{item.isCover && <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-800">Cover photo</span>}</p>
              {!item.id.startsWith("local-") && <div className="mt-3 border-t border-slate-100 pt-3">
                <details><summary className="min-h-8 cursor-pointer list-none text-xs font-extrabold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 [&::-webkit-details-marker]:hidden">Edit photo details</summary><form action={updateSchoolMedia} className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3"><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="mediaId" value={item.id} /><label className="block text-[11px] font-bold text-slate-700">Category<input name="category" defaultValue={item.category} maxLength={80} required className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs" /></label><label className="block text-[11px] font-bold text-slate-700">Caption<input name="caption" defaultValue={item.caption} maxLength={300} className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs" /></label><Button size="sm" className="h-9">Save details</Button></form></details>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <form action={moveSchoolMedia}><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="mediaId" value={item.id} /><input type="hidden" name="direction" value="up" /><button aria-label={`Move ${item.category} earlier`} className="min-h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Move earlier</button></form>
                  <form action={moveSchoolMedia}><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="mediaId" value={item.id} /><input type="hidden" name="direction" value="down" /><button aria-label={`Move ${item.category} later`} className="min-h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Move later</button></form>
                  {item.mediaType === "image" && item.moderationStatus === "approved" && <form action={setSchoolMediaCover}><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="mediaId" value={item.id} /><button className="min-h-8 rounded-lg border border-emerald-200 px-2 text-[11px] font-extrabold text-emerald-800 hover:bg-emerald-50">{item.isCover ? "Current cover" : "Set as cover"}</button></form>}
                  <details className="relative"><summary className="flex min-h-8 cursor-pointer list-none items-center rounded-lg px-2 text-[11px] font-bold text-rose-700 hover:bg-rose-50 [&::-webkit-details-marker]:hidden">Remove</summary><form action={deleteSchoolMedia} className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"><input type="hidden" name="schoolId" value={schoolId} /><input type="hidden" name="mediaId" value={item.id} /><p className="text-xs font-semibold text-slate-700">Remove this item from your profile?</p><Button size="sm" variant="outline" className="mt-2 w-full border-rose-200 text-rose-700">Yes, remove</Button></form></details>
                </div>
              </div>}
            </div>
          </article>)}
        </div> : galleryLoading ? <p role="status" className="mt-3 text-sm text-slate-500">Loading your uploads…</p> : galleryError ? <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Your uploads are saved, but the review gallery could not be loaded. Refresh this page to try again.</p> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Nothing uploaded yet. Your images and videos will appear here as soon as they’re saved.</div>}
      </section>
    </div>
  );
}
