export default function SchoolProfileSectionLoading() {
  return <main aria-busy="true" aria-label="Loading school profile" className="min-h-screen bg-[#f6f8f5]">
    <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,#edf5ee_0%,#fbf6e9_58%,#f2f6f1_100%)] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-3 w-52 rounded bg-emerald-900/10" />
        <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl bg-white/80 p-7"><div className="h-4 w-36 rounded bg-slate-200" /><div className="mt-5 h-10 max-w-md rounded bg-slate-200" /><div className="mt-4 h-4 max-w-sm rounded bg-slate-100" /><div className="mt-6 flex gap-2"><div className="h-8 w-28 rounded-full bg-slate-100" /><div className="h-8 w-36 rounded-full bg-slate-100" /></div></div>
          <div className="min-h-48 rounded-3xl bg-white/70 p-4"><div className="h-full min-h-40 rounded-2xl bg-slate-100" /></div>
        </div>
      </div>
    </div>
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="h-12 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-4"><div className="h-48 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /><div className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div><div className="h-64 animate-pulse rounded-3xl bg-emerald-900" /></div>
    </div>
  </main>;
}
