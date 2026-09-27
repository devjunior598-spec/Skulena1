function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200/75 ${className}`} />;
}

export default function SchoolProfileLoading() {
  return <main aria-label="Loading school profile" className="min-h-screen bg-[#f7f9f7]">
    <div className="h-[4.5rem] border-b border-slate-200 bg-white" />
    <section className="border-b border-emerald-100 bg-[#f2f7f3]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 lg:px-10">
        <Block className="mb-5 h-3 w-56" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white bg-white p-5 sm:p-7"><Block className="h-7 w-40" /><div className="mt-5 flex gap-4"><Block className="size-14 shrink-0 rounded-2xl" /><div className="min-w-0 flex-1"><Block className="h-9 w-4/5" /><Block className="mt-3 h-4 w-2/3" /></div></div><div className="mt-5 flex gap-2"><Block className="h-8 w-24 rounded-full" /><Block className="h-8 w-28 rounded-full" /><Block className="h-8 w-20 rounded-full" /></div><Block className="mt-5 h-11 w-52" /></div>
          <Block className="h-[288px] rounded-2xl sm:h-[350px] lg:h-full" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-16" />)}</div>
      </div>
    </section>
    <div className="h-12 border-b border-slate-200 bg-white" />
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10">
      <div className="space-y-4"><Block className="h-8 w-60" /><Block className="h-36" /><Block className="h-28" /></div>
      <div className="space-y-4"><Block className="h-64" /><Block className="h-40" /></div>
    </div>
  </main>;
}
