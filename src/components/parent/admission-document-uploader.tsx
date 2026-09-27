"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, Upload } from "lucide-react";
import { registerAdmissionDocument } from "@/app/admissions/actions";
import { createClient } from "@/lib/supabase/client";

const maxBytes = 20 * 1024 * 1024;
const categories = [
  ["previous_school_report", "Previous school report"],
  ["birth_certificate", "Birth certificate"],
  ["passport_photo", "Passport photograph"],
  ["transfer_document", "Transfer document"],
  ["other", "Other"],
] as const;

type DocumentRow = { id: string; category: string; file_name: string; byte_size: number };

async function detectMime(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) return "image/png";
  return null;
}

export function AdmissionDocumentUploader({
  applicationId,
  initialDocuments = [],
  showExistingDocuments = true,
}: {
  applicationId: string;
  initialDocuments?: DocumentRow[];
  showExistingDocuments?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<(typeof categories)[number][0]>("previous_school_report");
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    let uploadedPath: string | null = null;
    try {
      if (file.size < 1 || file.size > maxBytes) throw new Error("Choose a file smaller than 20 MB.");
      const mimeType = await detectMime(file);
      if (!mimeType || file.type !== mimeType) throw new Error("This file does not match a supported PDF, JPG or PNG document.");

      const client = createClient();
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in again before uploading this document.");

      const extension = mimeType === "application/pdf" ? "pdf" : mimeType === "image/jpeg" ? "jpg" : "png";
      const storagePath = `${authData.user.id}/${applicationId}/${crypto.randomUUID()}.${extension}`;
      const { error: storageError } = await client.storage.from("admission-documents").upload(storagePath, file, { contentType: mimeType, upsert: false });
      if (storageError) throw new Error(storageError.message || "The private upload was rejected.");
      uploadedPath = storagePath;

      const metadata = new FormData();
      metadata.set("applicationId", applicationId);
      metadata.set("category", category);
      metadata.set("fileName", file.name.slice(-180) || `admission-document.${extension}`);
      metadata.set("mimeType", mimeType);
      metadata.set("byteSize", String(file.size));
      metadata.set("storagePath", storagePath);
      const result = await registerAdmissionDocument(metadata);
      if (!result.ok) throw new Error(result.error);
      uploadedPath = null;

      setDocuments((current) => [{ id: storagePath, category, file_name: file.name, byte_size: file.size }, ...current]);
      setFile(null);
      setPreview("");
      if (fileRef.current) fileRef.current.value = "";
      setNotice("Document uploaded securely and attached to this application.");
      router.refresh();
    } catch (cause) {
      if (uploadedPath) await createClient().storage.from("admission-documents").remove([uploadedPath]);
      setError(cause instanceof Error ? cause.message : "The document could not be uploaded. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-4">
    {showExistingDocuments && documents.length > 0 && <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">{documents.map((document) => <li key={document.id} className="flex items-center gap-3 py-3"><FileText className="size-4 shrink-0 text-emerald-800" /><span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{document.file_name}</span><span className="text-xs text-slate-500">{(document.byte_size / 1024 / 1024).toFixed(1)} MB</span></li>)}</ul>}
    <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
      <label className="text-xs font-bold text-slate-700">Document type<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-700">PDF, JPG or PNG · max 20 MB<input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => { const nextFile = event.target.files?.[0] ?? null; setPreview(nextFile?.type.startsWith("image/") ? URL.createObjectURL(nextFile) : ""); setFile(nextFile); setError(""); setNotice(""); }} className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs" /></label>
      <button type="button" onClick={upload} disabled={!file || busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"><Upload className="size-4" />{busy ? "Uploading…" : "Upload"}</button>
    </div>
    {preview && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2"><Image src={preview} alt={`Preview of ${file?.name ?? "selected document"}`} width={480} height={320} unoptimized className="max-h-52 w-auto rounded-lg object-contain" /></div>}
    {file && !preview && <p className="text-xs text-slate-600">Selected: {file.name}</p>}
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
  </div>;
}
