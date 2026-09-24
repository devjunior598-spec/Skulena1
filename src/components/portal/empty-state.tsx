import type { LucideIcon } from "lucide-react";
export function EmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Icon className="size-5" /></span><h2 className="mt-4 text-lg font-extrabold text-[#0e2946]">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>{children && <div className="mt-5">{children}</div>}</div>;
}
