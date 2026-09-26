"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
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
};

function emptyEntry(id: number): MediaEntry {
  return { id, category: "Campus", customCategory: "", caption: "", file: null };
}

export function MediaUploader({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const nextEntryId = useRef(1);
  const [entries, setEntries] = useState<MediaEntry[]>([emptyEntry(0)]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");

  function updateEntry(id: number, update: Partial<MediaEntry>) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...update } : entry));
    setMessage("");
  }

  function addEntry() {
    if (entries.length >= maxFilesPerUpload) return;
    setEntries((current) => [...current, emptyEntry(nextEntryId.current++)]);
    setMessage("");
  }

  function removeEntry(id: number) {
    setEntries((current) => current.length === 1 ? [emptyEntry(nextEntryId.current++)] : current.filter((entry) => entry.id !== id));
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
          setProgress(`Uploading image ${index + 1} of ${entries.length}: ${file.name}`);
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
      failure = "The upload was interrupted. Any completed images are saved; try the remaining entries again.";
    }

    if (completed) {
      const remaining = entries.slice(completed);
      setEntries(remaining.length ? remaining : [emptyEntry(nextEntryId.current++)]);
      router.refresh();
    }
    setBusy(false);
    setProgress("");
    if (failure) {
      setMessage(completed ? `${completed} saved for review. ${entries.length - completed} remain in the list. ${failure}` : failure);
    } else {
      setMessage(`${completed} ${completed === 1 ? "image" : "images"} added for review. They’ll appear on your public profile after approval.`);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <ImagePlus className="size-5 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 className="font-extrabold text-[#0e2946]">Add school photos and videos</h2>
          <p className="mt-1 text-sm text-slate-600">Choose a category and file for each picture. Add another entry for every new image.</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {entries.map((entry, index) => <fieldset key={entry.id} disabled={busy} className="rounded-xl border border-slate-200 bg-white p-4">
          <legend className="px-2 text-sm font-extrabold text-[#0e2946]">Image {index + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Category
              <select value={entry.category} onChange={(event) => updateEntry(entry.id, { category: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3">
                {mediaCategories.map((category) => <option key={category} value={category}>{category === "3D Renderings" ? "3D school designs / renderings" : category === "Other" ? "Something else" : category}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">Choose an image
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => updateEntry(entry.id, { file: event.currentTarget.files?.[0] ?? null })} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold file:text-emerald-800" />
            </label>
          </div>
          {entry.category === "Other" && <label className="mt-4 block text-sm font-bold text-slate-700">Name this category
            <input value={entry.customCategory} onChange={(event) => updateEntry(entry.id, { customCategory: event.target.value })} maxLength={80} placeholder="e.g. Art room or school events" className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 sm:max-w-md" />
          </label>}
          {entry.category === "3D Renderings" && <p className="mt-3 rounded-xl bg-violet-50 p-3 text-sm leading-6 text-violet-950">Upload a rendered image of a planned campus, building or classroom as JPEG, PNG or WebP.</p>}
          {entry.file && <p className="mt-3 truncate text-xs font-semibold text-slate-600">Selected: {entry.file.name} · {(entry.file.size / 1048576).toFixed(1)} MB</p>}
          <label className="mt-4 block text-sm font-bold text-slate-700">Caption <span className="font-medium text-slate-500">(optional)</span>
            <input value={entry.caption} onChange={(event) => updateEntry(entry.id, { caption: event.target.value })} maxLength={300} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3" />
          </label>
          {entries.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="mt-3 text-slate-600"><X className="size-4" />Remove image</Button>}
        </fieldset>)}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={addEntry} disabled={busy || entries.length >= maxFilesPerUpload}><Plus className="size-4" />Add another image</Button>
        <Button type="button" onClick={upload} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{busy ? "Uploading…" : `Upload ${entries.length} ${entries.length === 1 ? "image" : "images"} for review`}</Button>
      </div>
      {progress && <p role="status" aria-live="polite" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><LoaderCircle className="size-4 animate-spin" />{progress}</p>}
      {message && <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold text-slate-600">{message}</p>}
      <p className="mt-3 text-xs leading-5 text-slate-500">Images: JPEG, PNG or WebP, up to 10 MB each. Videos: MP4 or WebM, up to 100 MB each. New uploads are reviewed before appearing publicly.</p>
    </div>
  );
}
