"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSavedSchool } from "@/app/saved/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

type ActionAppearance = Pick<ButtonProps, "className" | "variant" | "size">;

export function SaveSchoolButton({ slug, name, iconOnly = false, className, variant = "outline", size }: ActionAppearance & { slug: string; name: string; iconOnly?: boolean }) {
  const [remoteSaved, setRemoteSaved] = useState<boolean | null>(null);
  const saved = remoteSaved ?? false;
  const [announcement, setAnnouncement] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const signInDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const supabase = createClient();
    void (async () => {
      const authResult = await supabase.auth.getUser();
      const user = authResult.data.user as { id: string } | null;
      if (!user) return;
      const { data: school } = await supabase.from("public_school_profiles").select("id").eq("slug", slug).maybeSingle();
      if (!school) return;
      const { data } = await supabase.from("saved_schools").select("school_id").eq("parent_id", user.id).eq("school_id", school.id).maybeSingle();
      setRemoteSaved(Boolean(data));
    })();
  }, [slug]);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size ?? (iconOnly ? "icon" : "default")}
        className={cn(saved && "border-rose-200 text-rose-600 hover:text-rose-700", className)}
        aria-label={`${saved ? "Remove" : "Save"} ${name}${saved ? " from saved schools" : ""}`}
        aria-pressed={saved}
        onClick={async () => {
          const databaseResult = await toggleSavedSchool(slug);
          if ("requiresSignIn" in databaseResult) { setNeedsSignIn(true); signInDialog.current?.showModal(); return; }
          if ("error" in databaseResult) { setAnnouncement(databaseResult.error ?? "Unable to update saved schools."); return; }
          if ("saved" in databaseResult) { const nextSaved = Boolean(databaseResult.saved); setRemoteSaved(nextSaved); setAnnouncement(`${name} ${nextSaved ? "saved" : "removed from saved schools"}.`); }
        }}
      >
        <Heart className={cn("size-4.5", saved && "fill-current")} aria-hidden="true" />
        {!iconOnly && (saved ? "Saved" : "Save school")}
      </Button>
      <span className="sr-only" role="status">{announcement}</span>
      <dialog ref={signInDialog} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold text-[#0e2946]">Sign in to save schools</h2><p className="mt-3 text-sm leading-6 text-slate-600">A parent account keeps your shortlist private and available across devices.</p><div className="mt-6 flex gap-3"><Button asChild><a href={`/sign-in?next=${encodeURIComponent(`/school/${slug}`)}`}>Sign in</a></Button><Button variant="outline" type="button" onClick={() => { setNeedsSignIn(false); signInDialog.current?.close(); }}>Not now</Button></div><span className="sr-only">{needsSignIn ? "Sign in is required." : ""}</span></dialog>
    </>
  );
}

export function SaveButton({ slug, name = "school", ...props }: ActionAppearance & { slug: string; name?: string; iconOnly?: boolean }) {
  return <SaveSchoolButton slug={slug} name={name} {...props} />;
}

export function ShareButton({ name = "school", url, className, variant = "outline", size }: ActionAppearance & { name?: string; url?: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  async function share() {
    const link = url ? new URL(url, window.location.origin).href : window.location.href;
    setShareUrl(link);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      dialog.current?.showModal();
      requestAnimationFrame(() => input.current?.select());
    }
  }
  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={share} aria-label={`Share ${name}`}>
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}{copied ? "Link copied" : "Share"}
      </Button>
      <span className="sr-only" role="status">{copied ? "Link copied to clipboard." : ""}</span>
      <dialog ref={dialog} aria-labelledby={`${id}-title`} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-[#0e2946] shadow-2xl backdrop:bg-slate-950/45">
        <h2 id={`${id}-title`} className="text-xl font-extrabold">Share {name}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Automatic copying is unavailable in this browser. Select and copy this link to share it.</p>
        <label htmlFor={`${id}-link`} className="mt-5 block text-sm font-bold">School link</label>
        <input ref={input} id={`${id}-link`} value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm focus-visible:outline-emerald-600" />
        <Button type="button" className="mt-5 w-full" onClick={() => dialog.current?.close()}>Done</Button>
      </dialog>
    </>
  );
}
