"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
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
const maxFilesPerBatch = 12;

export function MediaUploader({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>("Campus");
  const [customCategory, setCustomCategory] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");

  function chooseFiles(fileList: FileList | null) {
    const nextFiles = Array.from(fileList ?? []);
    setMessage("");
    if (nextFiles.length > maxFilesPerBatch) {
      setFiles(nextFiles.slice(0, maxFilesPerBatch));
      setMessage(`Choose up to ${maxFilesPerBatch} files in one batch. You can upload another batch afterwards.`);
      return;
    }
    setFiles(nextFiles);
  }

  async function upload() {
    if (!files.length) { setMessage("Choose one or more photos or videos first."); return; }
    const selectedCategory = category === "Other" ? customCategory.trim() : category;
    if (selectedCategory.length < 2) { setMessage("Enter a category for these files."); return; }
    if (selectedCategory.length > 80) { setMessage("Keep the category name to 80 characters or fewer."); return; }
    const invalidFile = files.find((file) => !mimeTypes.includes(file.type as typeof mimeTypes[number]));
    if (invalidFile) { setMessage(`${invalidFile.name}: use JPEG, PNG or WebP images, or MP4/WebM videos.`); return; }
    const oversizedFile = files.find((file) => file.size > (file.type.startsWith("image/") ? 10485760 : 104857600));
    if (oversizedFile) { setMessage(`${oversizedFile.name} is too large. Images must be 10 MB or smaller; videos 100 MB or smaller.`); return; }

    setBusy(true);
    setMessage("");
    setProgress(`Preparing ${files.length} ${files.length === 1 ? "file" : "files"}…`);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setProgress("");
      setMessage("Sign in again before uploading.");
      return;
    }

    let completed = 0;
    let failure = "";
    for (const [index, file] of files.entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
      const extension = extensionByMime[file.type as keyof typeof extensionByMime];
      const storagePath = `${schoolId}/${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("school-media").upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) { failure = `${file.name} could not be uploaded. Please try again.`; break; }

      const mediaType = file.type.startsWith("image/") ? "image" : "video";
      const result = await registerMediaRecord({ schoolId, category: selectedCategory, caption: caption.trim(), mediaType, storagePath, mimeType: file.type, byteSize: file.size });
      if (result.error) {
        await supabase.storage.from("school-media").remove([storagePath]);
        failure = `${file.name}: ${result.error}`;
        break;
      }
      completed += 1;
    }

    if (completed) {
      const remaining = files.slice(completed);
      setFiles(remaining);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
    setBusy(false);
    setProgress("");
    if (failure) {
      setMessage(completed ? `${completed} uploaded for review; ${files.length - completed} still selected. ${failure}` : failure);
    } else {
      setMessage(`${completed} ${completed === 1 ? "file" : "files"} uploaded for review. They’ll appear on your public profile after approval.`);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <ImagePlus className="size-5 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 className="font-extrabold text-[#0e2946]">Add school photos and videos</h2>
          <p className="mt-1 text-sm text-slate-600">Choose a category, then add up to {maxFilesPerBatch} files for it. Upload another batch for a different category.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">What do these pictures show?
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3">
            {mediaCategories.map((item) => <option key={item} value={item}>{item === "3D Renderings" ? "3D school designs / renderings" : item === "Other" ? "Something else" : item}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-slate-700">Photos or videos
          <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => chooseFiles(event.currentTarget.files)} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold file:text-emerald-800" />
        </label>
      </div>

      {category === "Other" && <label className="mt-4 block text-sm font-bold text-slate-700">Name this category
        <input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} maxLength={80} placeholder="e.g. Art room or school events" className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 sm:max-w-md" />
      </label>}

      {category === "3D Renderings" && <p className="mt-3 rounded-xl bg-violet-50 p-3 text-sm leading-6 text-violet-950">Use this category for a rendered image of a planned campus, building or classroom. Upload it as JPEG, PNG or WebP.</p>}

      <label className="mt-4 block text-sm font-bold text-slate-700">Caption <span className="font-medium text-slate-500">(optional; used for every selected file)</span>
        <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={300} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3" />
      </label>

      {files.length > 0 && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-[#0e2946]">{files.length} selected for {category === "Other" ? (customCategory.trim() || "Other") : category}</p>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setFiles([]); if (inputRef.current) inputRef.current.value = ""; }}>Clear</Button>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 p-2">
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-emerald-50 text-[10px] font-extrabold text-emerald-800">{file.type.startsWith("image/") ? "PHOTO" : "VIDEO"}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700" title={file.name}>{file.name}</span>
            <span className="shrink-0 text-xs text-slate-500">{(file.size / 1048576).toFixed(1)} MB</span>
            {!busy && <button type="button" className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-rose-700" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X className="size-4" /></button>}
          </li>)}
        </ul>
      </div>}

      {progress && <p role="status" aria-live="polite" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><LoaderCircle className="size-4 animate-spin" />{progress}</p>}
      {message && <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold text-slate-600">{message}</p>}
      <Button type="button" className="mt-4" onClick={upload} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{busy ? "Uploading…" : `Upload ${files.length || "selected"} ${files.length === 1 ? "file" : "files"} for review`}</Button>
      <p className="mt-3 text-xs leading-5 text-slate-500">Images: JPEG, PNG or WebP, up to 10 MB each. Videos: MP4 or WebM, up to 100 MB each. New uploads are reviewed before appearing publicly.</p>
    </div>
  );
}
