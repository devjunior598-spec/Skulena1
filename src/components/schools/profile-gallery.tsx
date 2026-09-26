"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileMedia } from "@/data/profile";

export function ProfileGallery({ media, variant = "grid" }: { media: ProfileMedia[]; variant?: "hero" | "grid" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [category, setCategory] = useState("All media");
  const [open, setOpen] = useState(false);
  const selected = media[selectedIndex];
  const visible = category === "All media" ? media : media.filter((item) => item.category === category);
  const categories = Array.from(new Set(media.map((item) => item.category))).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function showItem(index: number) {
    setSelectedIndex(index);
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function changeItem(direction: number) {
    setSelectedIndex((index) => (index + direction + media.length) % media.length);
  }

  if (!selected) return <div role="status" className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">No photos or videos have been added to this school profile yet.</div>;

  return <>
    {variant === "hero" ? <div className={`relative grid h-[290px] gap-2 overflow-hidden rounded-3xl sm:h-[420px] ${media.length > 1 ? "sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2" : "grid-cols-1"}`}>
      {media.slice(0, 4).map((item, index) => <button key={item.id} type="button" onClick={() => showItem(index)} aria-label={`Open ${item.category} ${item.mediaType}`} className={`group relative min-h-0 overflow-hidden bg-slate-100 focus-visible:z-10 focus-visible:outline-4 focus-visible:outline-emerald-600 ${index === 0 ? (media.length > 1 ? "sm:row-span-2 lg:col-span-2" : "") : `hidden sm:block ${index === 1 ? "lg:col-span-2" : ""}`}`}>
        {item.mediaType === "video" ? <><video src={item.src} muted playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 size-full object-cover" /><span className="absolute right-3 top-3 rounded-full bg-slate-950/75 p-2 text-white"><Video className="size-4" aria-hidden="true" /></span></> : <Image src={item.src} alt={item.alt} fill priority={index === 0} className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" sizes={index === 0 ? "(max-width: 640px) 100vw, 60vw" : "(max-width: 1024px) 50vw, 30vw"} />}
      </button>)}
      <Button variant="outline" onClick={() => showItem(0)} className="absolute bottom-4 right-4 shadow-lg"><Images className="size-4" />View {media.length} {media.length === 1 ? "item" : "items"}</Button>
    </div> : <div>
      <label htmlFor={`${titleId}-category`} className="mb-2 block text-sm font-bold text-slate-700">Media category</label>
      <select id={`${titleId}-category`} value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-2 focus:outline-emerald-600 sm:max-w-xs">
        <option>All media</option>
        {categories.map((item) => <option key={item} value={item}>{item} ({media.filter((entry) => entry.category === item).length})</option>)}
      </select>
      <p role="status" className="mt-3 text-sm text-slate-500">{visible.length} {visible.length === 1 ? "item" : "items"}</p>
      {visible.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{visible.map((item) => <button type="button" key={item.id} onClick={() => showItem(media.findIndex((entry) => entry.id === item.id))} aria-label={`Open ${item.category} ${item.mediaType}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-4 focus-visible:outline-emerald-600">
        {item.mediaType === "video" ? <><video src={item.src} muted playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 size-full object-cover" /><span className="absolute right-2 top-2 rounded-full bg-slate-950/75 p-1.5 text-white"><Video className="size-3.5" aria-hidden="true" /></span></> : <Image src={item.src} alt={item.alt} fill className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3 pt-8 text-left text-sm font-bold text-white">{item.category}</span>
      </button>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-600">No media has been added to this category yet.</p>}
    </div>}

    <dialog ref={dialogRef} aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); changeItem(-1); } if (event.key === "ArrowRight") { event.preventDefault(); changeItem(1); } }} className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-4xl overflow-auto rounded-2xl border-0 bg-white p-0 text-[#0e2946] shadow-2xl backdrop:bg-slate-950/75">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"><h2 id={titleId} className="text-lg font-extrabold">{selected.category}</h2><Button variant="ghost" size="icon" aria-label="Close media gallery" onClick={() => dialogRef.current?.close()}><X className="size-5" /></Button></div>
      <div className="relative grid h-[48dvh] min-h-48 place-items-center bg-slate-950 sm:h-[60dvh]">{selected.mediaType === "video" ? <video src={selected.src} controls playsInline preload="metadata" aria-label={selected.caption || `${selected.category} video`} className="max-h-full max-w-full" /> : <Image src={selected.src} alt={selected.alt} fill className="object-contain" sizes="(max-width: 900px) 100vw, 900px" />}</div>
      <div className="flex items-center justify-between gap-3 p-4 sm:px-6"><div className="min-w-0"><p className="text-sm font-semibold">{selected.caption || selected.category}</p><p aria-live="polite" className="mt-1 text-xs text-slate-500">Item {selectedIndex + 1} of {media.length}</p></div>{media.length > 1 && <div className="flex shrink-0 gap-1"><Button variant="outline" size="icon" aria-label="Previous item" onClick={() => changeItem(-1)}><ChevronLeft className="size-5" /></Button><Button variant="outline" size="icon" aria-label="Next item" onClick={() => changeItem(1)}><ChevronRight className="size-5" /></Button></div>}</div>
    </dialog>
  </>;
}
