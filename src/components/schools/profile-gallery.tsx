"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaCategories, type ProfileMedia } from "@/data/profile";

export function ProfileGallery({ media, variant = "grid" }: { media: ProfileMedia[]; variant?: "hero" | "grid" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [category, setCategory] = useState<string>("All photos");
  const [open, setOpen] = useState(false);
  const selected = media[selectedIndex];
  const visible = category === "All photos" ? media : media.filter((item) => item.category === category);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function showPhoto(index: number) {
    setSelectedIndex(index);
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function changePhoto(direction: number) {
    setSelectedIndex((index) => (index + direction + media.length) % media.length);
  }

  if (!selected) return <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">No photos are available for this demo profile.</p>;

  return <>
    {variant === "hero" ? (
      <div className={`relative grid h-[290px] gap-2 overflow-hidden rounded-3xl sm:h-[420px] ${media.length > 1 ? "sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2" : "grid-cols-1"}`}>
        {media.slice(0, 4).map((item, index) => (
          <button key={item.id} type="button" onClick={() => showPhoto(index)} aria-label={`Open ${item.category.toLowerCase()} photo: illustrative stock image`} className={`group relative min-h-0 overflow-hidden bg-slate-100 focus-visible:z-10 focus-visible:outline-4 focus-visible:outline-emerald-600 ${index === 0 ? (media.length > 1 ? "sm:row-span-2 lg:col-span-2" : "") : `hidden sm:block ${index === 1 ? "lg:col-span-2" : ""}`}`}>
            <Image src={item.src} alt={item.alt} fill priority={index === 0} className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" sizes={index === 0 ? "(max-width: 640px) 100vw, 60vw" : "(max-width: 1024px) 50vw, 30vw"} />
          </button>
        ))}
        <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-[#0e2946]/85 px-3 py-1.5 text-xs font-bold text-white">Illustrative photos</span>
        <Button variant="outline" onClick={() => showPhoto(0)} className="absolute bottom-4 right-4 shadow-lg"><Images className="size-4" /> View {media.length} {media.length === 1 ? "photo" : "photos"}</Button>
      </div>
    ) : (
      <div>
        <label htmlFor={`${titleId}-category`} className="mb-2 block text-sm font-bold text-slate-700">Facility category</label>
        <select id={`${titleId}-category`} value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-2 focus:outline-emerald-600 sm:max-w-xs">
          <option>All photos</option>
          {mediaCategories.map((item) => <option key={item} value={item}>{item} ({media.filter((photo) => photo.category === item).length})</option>)}
        </select>
        <p role="status" className="mt-3 text-sm text-slate-500">{visible.length} illustrative {visible.length === 1 ? "photo" : "photos"} · no videos uploaded</p>
        {visible.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{visible.map((item) => <button type="button" key={item.id} onClick={() => showPhoto(media.findIndex((photo) => photo.id === item.id))} aria-label={`Open ${item.category.toLowerCase()} photo: illustrative stock image`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-4 focus-visible:outline-emerald-600">
          <Image src={item.src} alt={item.alt} fill className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3 pt-8 text-left text-sm font-bold text-white">{item.category}</span>
        </button>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-600">No demo photos have been added for {category.toLowerCase()}. A category label does not confirm that a facility exists.</p>}
      </div>
    )}
    <dialog ref={dialogRef} aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); changePhoto(-1); } if (event.key === "ArrowRight") { event.preventDefault(); changePhoto(1); } }} className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-4xl overflow-auto rounded-2xl border-0 bg-white p-0 text-[#0e2946] shadow-2xl backdrop:bg-slate-950/75">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"><h2 id={titleId} className="text-lg font-extrabold">{selected.category}</h2><Button variant="ghost" size="icon" aria-label="Close photo gallery" onClick={() => dialogRef.current?.close()}><X className="size-5" /></Button></div>
      <div className="relative h-[48dvh] min-h-48 bg-slate-100 sm:h-[60dvh]"><Image src={selected.src} alt={selected.alt} fill className="object-contain" sizes="(max-width: 900px) 100vw, 900px" /></div>
      <div className="flex items-center justify-between gap-3 p-4 sm:px-6"><div className="min-w-0"><p className="text-sm font-semibold">{selected.caption}</p><p aria-live="polite" className="mt-1 text-xs text-slate-500">Photo {selectedIndex + 1} of {media.length} · Not evidence of this school&apos;s facilities</p></div>{media.length > 1 && <div className="flex shrink-0 gap-1"><Button variant="outline" size="icon" aria-label="Previous photo" onClick={() => changePhoto(-1)}><ChevronLeft className="size-5" /></Button><Button variant="outline" size="icon" aria-label="Next photo" onClick={() => changePhoto(1)}><ChevronRight className="size-5" /></Button></div>}</div>
    </dialog>
  </>;
}
