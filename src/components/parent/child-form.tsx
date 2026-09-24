"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { childSchema, type ChildValues } from "@/lib/validation/child";
import { createChild } from "@/app/parent/children/actions";

const input = "mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10";
export function ChildForm() {
  const [open, setOpen] = useState(false); const [message, setMessage] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChildValues>({ resolver: zodResolver(childSchema), defaultValues: { firstName: "", lastName: "", dateOfBirth: "", currentLevel: "", targetLevel: "", notes: "" } });
  if (!open) return <Button onClick={() => setOpen(true)}><Plus className="size-4" />Add child</Button>;
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-[#0e2946]">Add a child profile</h2><Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close form"><X className="size-4" /></Button></div><p className="mt-2 text-sm text-slate-500">Private to your account. It is never shown on public pages.</p>
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(async (values) => { setMessage(""); const result = await createChild(values); if (result.error) setMessage(result.error); else { reset(); setOpen(false); } })}>
      <label className="text-sm font-bold text-slate-700">First name<input {...register("firstName")} className={input} />{errors.firstName && <span className="mt-1 block text-xs text-rose-700">{errors.firstName.message}</span>}</label>
      <label className="text-sm font-bold text-slate-700">Last name<input {...register("lastName")} className={input} /></label>
      <label className="text-sm font-bold text-slate-700">Date of birth<input type="date" {...register("dateOfBirth")} className={input} /></label>
      <label className="text-sm font-bold text-slate-700">Current level<input {...register("currentLevel")} className={input} placeholder="e.g. Primary 2" /></label>
      <label className="text-sm font-bold text-slate-700">Target level<input {...register("targetLevel")} className={input} placeholder="e.g. Primary 3" /></label>
      <label className="text-sm font-bold text-slate-700 sm:col-span-2">Private notes<textarea {...register("notes")} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10" /></label>
      {message && <p role="alert" className="text-sm font-semibold text-rose-700 sm:col-span-2">{message}</p>}<Button type="submit" disabled={isSubmitting} className="sm:col-span-2">{isSubmitting ? "Saving…" : "Save child profile"}</Button>
    </form></div>;
}
