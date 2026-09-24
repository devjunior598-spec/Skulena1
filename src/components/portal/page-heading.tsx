export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-[#0e2946] sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p></div>{action}</div>;
}
