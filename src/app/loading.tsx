export default function Loading() {
  return <main id="main-content" aria-busy="true" aria-label="Loading schools" className="mx-auto max-w-7xl space-y-8 px-5 py-20"><p role="status" className="font-semibold text-emerald-700">Finding your next chapter…</p><div className="h-16 w-3/4 rounded-xl bg-slate-100 motion-safe:animate-pulse" /><div className="grid gap-6 sm:grid-cols-3">{[1, 2, 3].map((id) => <div key={id} className="h-80 rounded-3xl bg-slate-100 motion-safe:animate-pulse" />)}</div></main>;
}
