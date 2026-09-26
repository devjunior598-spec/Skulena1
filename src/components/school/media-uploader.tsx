"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Plus, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { registerMediaRecord } from "@/app/school/(portal)/media/actions";
import { mediaCategories } from "@/types/domain";

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
};

type UploadedMediaRecord = {
  id: string;
  category: string;
  media_type: "image" | "video";
  storage_path: string;
  caption: string | null;
  moderation_status: string;
};

function emptyEntry(id: number): MediaEntry {
  return { id, category: "Campus", customCategory: "", caption: "", file: null, previewUrl: "" };
}

function mediaStatus(status: string) {
  if (status === "pending") return "Pending review";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Needs an update";
  return status;
}

export function MediaUploader({ schoolId, onPendingCountChange }: { schoolId: string; onPendingCountChange?: (count: number) => void }) {
  const router = useRouter();
  const nextEntryId = useRef(1);
  const previewUrls = useRef(new Map<number, string>());
  const [entries, setEntries] = useState<MediaEntry[]>([emptyEntry(0)]);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");

  const loadUploadedMedia = useCallback(async (): Promise<UploadedMedia[] | null> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("school_media")
        .select("id, category, media_type, storage_path, caption, moderation_status")
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
        return [{ id: item.id, category: item.category, mediaType: item.media_type, caption: item.caption || "", src, moderationStatus: String(item.moderation_status) }];
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

  function addEntry() {
    if (entries.length >= maxFilesPerUpload) return;
    setEntries((current) => [...current, emptyEntry(nextEntryId.current++)]);
    setMessage("");
  }

  function removeEntry(id: number) {
    const next = entries.length === 1 ? [emptyEntry(nextEntryId.current++)] : entries.filter((entry) => entry.id !== id);
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
        return [{ id: `local-${entry.id}`, category: entry.category === "Other" ? entry.customCategory.trim() : entry.category, mediaType: entry.file.type.startsWith("video/") ? "video" : "image", caption: entry.caption.trim(), src: entry.previewUrl, moderationStatus: "pending" }];
      });
      setUploadedMedia((current) => [...immediatePreviews, ...current]);
      setGalleryLoading(false);
      setGalleryError(false);
      const persistedMedia = await loadUploadedMedia();
      if (persistedMedia) setUploadedMedia(persistedMedia);
      const remaining = entries.slice(completed);
      setEntries(remaining.length ? remaining : [emptyEntry(nextEntryId.current++)]);
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <ImagePlus className="size-5 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 className="font-extrabold text-[#0e2946]">Add school photos and videos</h2>
          <p className="mt-1 text-sm text-slate-600">Choose a category and file for each entry. Preview everything here before continuing.</p>
        </div>
      </div>

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
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{item.mediaType === "video" && <Video className="size-3.5" aria-hidden="true" />}{item.mediaType}</p>
            </div>
          </article>)}
        </div> : galleryLoading ? <p role="status" className="mt-3 text-sm text-slate-500">Loading your uploads…</p> : galleryError ? <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Your uploads are saved, but the review gallery could not be loaded. Refresh this page to try again.</p> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Nothing uploaded yet. Your images and videos will appear here as soon as they’re saved.</div>}
      </section>
    </div>
  );
}
