"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, School, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileMedia } from "@/data/profile";

function GalleryMedia({ item, index }: { item: ProfileMedia; index: number }) {
  if (item.mediaType === "video") return <><video src={item.src} muted playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 size-full object-cover" /><span className="absolute right-2 top-2 rounded-full bg-slate-950/75 p-1.5 text-white"><Video className="size-3.5" aria-hidden="true" /></span></>;
  return <Image src={item.src} alt={item.alt} fill preload={index === 0} className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" sizes={index === 0 ? "(max-width: 640px) 76vw, (max-width: 1024px) 55vw, 40vw" : "(max-width: 640px) 22vw, 25vw"} />;
}

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

  if (!selected) return <div role="status" className={`relative isolate grid place-items-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(135deg,#f7faf7,#eef3f5)] p-6 text-center ${variant === "hero" ? "h-[288px] sm:h-[350px]" : "min-h-48"}`}>
    <span aria-hidden="true" className="absolute -right-12 -top-16 -z-10 size-56 rounded-full border border-emerald-900/5" /><span aria-hidden="true" className="absolute -right-3 -top-7 -z-10 size-36 rounded-full border border-emerald-900/5" />
    <span className="grid size-12 place-items-center rounded-2xl bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200"><School className="size-5" aria-hidden="true" /></span>
    <span className="mt-3 block text-sm font-extrabold text-[#18344d]">No school photos are available yet.</span>
    <span className="mt-1 block max-w-xs text-xs leading-5 text-slate-500">Approved campus photos and videos will appear here when the school adds them.</span>
  </div>;

  const heroItems = media.slice(0, 4);
  const heroThumbs = heroItems.slice(1);

  return <>
    {variant === "hero" ? <div className="relative overflow-hidden rounded-2xl">
      <div className="grid h-[288px] grid-cols-[minmax(0,1fr)_minmax(72px,24%)] gap-1.5 sm:hidden" style={{ gridTemplateRows: `repeat(${Math.max(heroThumbs.length, 1)}, minmax(0, 1fr))` }}>
        <button type="button" onClick={() => showItem(0)} aria-label={`Open ${heroItems[0].category} ${heroItems[0].mediaType}`} className={`group relative min-h-0 overflow-hidden bg-slate-100 focus-visible:z-10 focus-visible:outline-4 focus-visible:outline-emerald-600 ${heroThumbs.length ? "" : "col-span-2"}`} style={heroThumbs.length ? { gridRow: `span ${heroThumbs.length} / span ${heroThumbs.length}` } : undefined}>
          <GalleryMedia item={heroItems[0]} index={0} />
          <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-white">{heroItems[0].verificationStatus === "verified" ? "Media verified" : "School uploaded"}</span>
        </button>
        {heroThumbs.map((item, index) => <button key={item.id} type="button" onClick={() => showItem(index + 1)} aria-label={`Open ${item.category} ${item.mediaType}`} className="group relative min-h-0 overflow-hidden bg-slate-100 focus-visible:z-10 focus-visible:outline-4 focus-visible:outline-emerald-600">
          <GalleryMedia item={item} index={index + 1} />
          <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-950/90 to-transparent px-1.5 pb-1.5 pt-4 text-left text-[9px] font-bold text-white">{item.category}</span>
        </button>)}
      </div>
      <div className="hidden h-[350px] gap-2 sm:grid sm:grid-cols-[1.4fr_1fr] sm:grid-rows-2 lg:h-[410px]">
        {heroItems.map((item, index) => <button key={item.id} type="button" onClick={() => showItem(index)} aria-label={`Open ${item.category} ${item.mediaType}`} className={`group relative min-h-0 overflow-hidden bg-slate-100 focus-visible:z-10 focus-visible:outline-4 focus-visible:outline-emerald-600 ${index === 0 ? heroItems.length === 1 ? "col-span-2 row-span-2" : "row-span-2" : heroItems.length === 2 ? "row-span-2" : ""}`}>
          <GalleryMedia item={item} index={index} />
          <span className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-1 bg-gradient-to-t from-slate-950/90 to-transparent px-3 pb-2.5 pt-8 text-left text-[10px] font-bold text-white sm:text-xs"><span className="truncate">{item.category}</span><span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-[9px]">{item.verificationStatus === "verified" ? "Media verified" : "School uploaded"}</span></span>
        </button>)}
      </div>
      <Button variant="outline" onClick={() => showItem(0)} className="absolute bottom-2 right-2 min-h-10 bg-white/95 text-xs shadow-lg sm:bottom-3 sm:right-3"><Images className="size-4" />View {media.length} {media.length === 1 ? (media[0].mediaType === "video" ? "video" : "photo") : "photos & videos"}</Button>
    </div> : <div>
      <label htmlFor={`${titleId}-category`} className="mb-2 block text-sm font-bold text-slate-700">Media category</label>
      <select id={`${titleId}-category`} value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-2 focus:outline-emerald-600 sm:max-w-xs">
        <option>All media</option>
        {categories.map((item) => <option key={item} value={item}>{item} ({media.filter((entry) => entry.category === item).length})</option>)}
      </select>
      <p role="status" className="mt-3 text-sm text-slate-500">{visible.length} {visible.length === 1 ? "item" : "items"}</p>
      {visible.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{visible.map((item) => <button type="button" key={item.id} onClick={() => showItem(media.findIndex((entry) => entry.id === item.id))} aria-label={`Open ${item.category} ${item.mediaType}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-4 focus-visible:outline-emerald-600">
        {item.mediaType === "video" ? <><video src={item.src} muted playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 size-full object-cover" /><span className="absolute right-2 top-2 rounded-full bg-slate-950/75 p-1.5 text-white"><Video className="size-3.5" aria-hidden="true" /></span></> : <Image src={item.src} alt={item.alt} fill className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3 pt-8 text-left text-sm font-bold text-white">{item.category}</span><span className="absolute left-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-[9px] font-bold text-white">{item.verificationStatus === "verified" ? "Media verified" : "School uploaded"}</span>
      </button>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-600">No media has been added to this category yet.</p>}
    </div>}

    <dialog ref={dialogRef} aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); changeItem(-1); } if (event.key === "ArrowRight") { event.preventDefault(); changeItem(1); } }} className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-4xl overflow-auto rounded-2xl border-0 bg-white p-0 text-[#0e2946] shadow-2xl backdrop:bg-slate-950/75">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"><h2 id={titleId} className="text-lg font-extrabold">{selected.category}</h2><Button variant="ghost" size="icon" aria-label="Close media gallery" onClick={() => dialogRef.current?.close()}><X className="size-5" /></Button></div>
      <div className="relative grid h-[48dvh] min-h-48 place-items-center bg-slate-950 sm:h-[60dvh]">{selected.mediaType === "video" ? <video src={selected.src} controls playsInline preload="metadata" aria-label={selected.caption || `${selected.category} video`} className="max-h-full max-w-full" /> : <Image src={selected.src} alt={selected.alt} fill className="object-contain" sizes="(max-width: 900px) 100vw, 900px" />}</div>
      <div className="flex items-center justify-between gap-3 p-4 sm:px-6"><div className="min-w-0"><p className="text-sm font-semibold">{selected.caption || selected.category}</p><p aria-live="polite" className="mt-1 text-xs text-slate-500">{selected.verificationStatus === "verified" ? "Media verified" : "Uploaded by the school"} · Item {selectedIndex + 1} of {media.length}</p></div>{media.length > 1 && <div className="flex shrink-0 gap-1"><Button variant="outline" size="icon" aria-label="Previous item" onClick={() => changeItem(-1)}><ChevronLeft className="size-5" /></Button><Button variant="outline" size="icon" aria-label="Next item" onClick={() => changeItem(1)}><ChevronRight className="size-5" /></Button></div>}</div>
    </dialog>
  </>;
}
