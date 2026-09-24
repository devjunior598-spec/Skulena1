"use client";

import Link from "next/link";
import { useId, useMemo, useOptimistic, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown, List, Map, MapPin, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { School } from "@/data/schools";
import { formatNaira } from "@/data/schools";
import { Button } from "@/components/ui/button";
import { SchoolCard } from "@/components/schools/school-card";
import { cn } from "@/lib/utils";
import { filterSchools, parseSchoolFilters, schoolSearchParams, searchOptions, type SchoolFilters, type SchoolSort } from "@/lib/school-search";

type ChangeFilters = (patch: Partial<SchoolFilters>) => void;
type MultiFilter = "level" | "type" | "curriculum" | "verification" | "facility";
const inputClass = "h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-[#0e2946] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";
const pageSize = 6;

function FilterContent({ filters, change, reset, cities, demoData }: { filters: SchoolFilters; change: ChangeFilters; reset: () => void; cities: string[]; demoData: boolean }) {
  const id = useId();
  const groups: { key: MultiFilter; title: string; options: { value: string; label: string }[] }[] = [
    { key: "level", title: "School level", options: searchOptions.level.map((label) => ({ label, value: label.toLowerCase() })) },
    { key: "type", title: "School type", options: searchOptions.type.map((label) => ({ label, value: label.toLowerCase() })) },
    { key: "curriculum", title: "Curriculum", options: searchOptions.curriculum.map((label) => ({ label, value: label.toLowerCase() })) },
    { key: "verification", title: "Sample verification status", options: searchOptions.verification },
  ];

  function toggle(key: MultiFilter, value: string) {
    change({ [key]: filters[key].includes(value) ? filters[key].filter((item) => item !== value) : [...filters[key], value] });
  }

  function submitFees(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const minInputValue = String(data.get("minFee") ?? "");
    const maxInputValue = String(data.get("maxFee") ?? "");
    const minFee = minInputValue ? String(Number(minInputValue)) : "";
    const maxFee = maxInputValue ? String(Number(maxInputValue)) : "";
    const maxInput = form.elements.namedItem("maxFee") as HTMLInputElement;
    maxInput.setCustomValidity(minFee && maxFee && Number(minFee) > Number(maxFee) ? "Maximum fee must be at least the minimum fee." : "");
    if (form.reportValidity()) change({ minFee, maxFee });
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="font-extrabold text-[#0e2946]">Your preferences</h2>
        <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-emerald-700"><RotateCcw className="size-3.5" aria-hidden="true" /> Reset</button>
      </div>
      <div className="border-b border-slate-200 py-5">
        <label htmlFor={`${id}-city`} className="mb-2 block text-sm font-extrabold text-[#0e2946]">City</label>
        <select id={`${id}-city`} value={filters.city.toLowerCase()} onChange={(event) => change({ city: event.target.value, area: "", state: "" })} className={inputClass}>
          <option value="">All cities</option>
          {[...new Set([...cities, filters.city].filter(Boolean).map((city) => city.toLowerCase()))].map((city) => <option key={city} value={city}>{city.charAt(0).toUpperCase() + city.slice(1)}</option>)}
        </select>
      </div>
      <form key={`${filters.minFee}-${filters.maxFee}`} onSubmit={submitFees} className="border-b border-slate-200 py-5">
        <h3 className="text-sm font-extrabold text-[#0e2946]">Fee range / term</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label htmlFor={`${id}-min`} className="text-xs font-semibold text-slate-600">Minimum (₦)<input id={`${id}-min`} name="minFee" type="number" min="0" max="9999999999" step="1" defaultValue={filters.minFee} placeholder="Any" className={cn(inputClass, "mt-1")} onInput={(event) => { const max = event.currentTarget.form?.elements.namedItem("maxFee") as HTMLInputElement | null; max?.setCustomValidity(""); }} /></label>
          <label htmlFor={`${id}-max`} className="text-xs font-semibold text-slate-600">Maximum (₦)<input id={`${id}-max`} name="maxFee" type="number" min="0" max="9999999999" step="1" defaultValue={filters.maxFee} placeholder="Any" className={cn(inputClass, "mt-1")} onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Fees vary by class. Matches overlapping fee ranges.</p>
        <Button type="submit" variant="outline" size="sm" className="mt-3 w-full">Apply fee range</Button>
      </form>
      {groups.map((group) => (
        <fieldset key={group.key} className="border-b border-slate-200 py-5">
          <legend className="float-left mb-3 w-full text-sm font-extrabold text-[#0e2946]">{group.title}</legend>
          <div className="clear-both space-y-1">
            {group.options.map((option) => <label key={option.value} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" checked={filters[group.key].includes(option.value)} onChange={() => toggle(group.key, option.value)} className="size-4 shrink-0 rounded border-slate-300 accent-emerald-600" />{option.label}</label>)}
          </div>
        </fieldset>
      ))}
      <details className="group border-b border-slate-200 py-5" open={filters.facility.length > 0 || filters.transport || filters.special || Boolean(filters.classSize) || undefined}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm font-extrabold text-[#0e2946]">Facilities & support <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" /></summary>
        <fieldset className="mt-2 space-y-1">
          <legend className="sr-only">Facilities</legend>
          {searchOptions.facility.map((facility) => <label key={facility} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" checked={filters.facility.includes(facility.toLowerCase())} onChange={() => toggle("facility", facility.toLowerCase())} className="size-4 shrink-0 accent-emerald-600" />{facility}</label>)}
          <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" checked={filters.transport} onChange={(event) => change({ transport: event.target.checked })} className="size-4 shrink-0 accent-emerald-600" />School transportation</label>
          <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" checked={filters.special} onChange={(event) => change({ special: event.target.checked })} className="size-4 shrink-0 accent-emerald-600" />Special-needs support</label>
        </fieldset>
        <label htmlFor={`${id}-class-size`} className="mb-2 mt-4 block text-sm font-extrabold text-[#0e2946]">Maximum class size</label>
        <select id={`${id}-class-size`} value={filters.classSize} onChange={(event) => change({ classSize: event.target.value })} className={inputClass}>
          <option value="">Any class size</option>
          {[15, 18, 20, 25, 30, ...(filters.classSize && ![15, 18, 20, 25, 30].includes(Number(filters.classSize)) ? [Number(filters.classSize)] : [])].sort((a, b) => a - b).map((size) => <option key={size} value={String(size)}>{size} students or fewer</option>)}
        </select>
      </details>
      <p className="pt-4 text-xs leading-5 text-slate-500">{demoData ? "Sample listings currently cover Ibadan. " : ""}Distance, gender and faith filters need additional school data.</p>
    </div>
  );
}

function DemoMap({ schools, demoData }: { schools: School[]; demoData: boolean }) {
  if (!demoData) return <section aria-label="Map availability" className="grid h-[320px] place-items-center rounded-3xl border border-slate-200 bg-[#eaf3ee] p-6 text-center"><div><Map className="mx-auto size-7 text-emerald-700" /><h2 className="mt-4 text-lg font-extrabold text-[#0e2946]">Map view is coming soon</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Published school locations are available in profiles. Live map pins and directions will be added after a map provider is configured.</p></div></section>;
  const positions = [[24, 30], [67, 43], [36, 63], [73, 77], [18, 81], [74, 22]];
  return (
    <section aria-label="Illustrative map of sample results" className="relative h-[440px] overflow-hidden rounded-3xl border border-slate-200 bg-[#eaf3ee] xl:h-[calc(100vh-180px)] xl:min-h-[500px]">
      <div aria-hidden="true" className="absolute inset-0 opacity-55" style={{ backgroundImage: "linear-gradient(#b9d7ca 1px, transparent 1px), linear-gradient(90deg, #b9d7ca 1px, transparent 1px)", backgroundSize: "42px 42px", transform: "rotate(-6deg) scale(1.15)" }} />
      <div aria-hidden="true" className="absolute left-[18%] top-[16%] h-[68%] w-3 rotate-[-20deg] rounded-full bg-sky-200/80" />
      <div aria-hidden="true" className="absolute right-[23%] top-[5%] h-[85%] w-2 rotate-[14deg] rounded-full bg-white/90" />
      <div className="absolute inset-x-4 top-4 rounded-xl bg-white/95 px-4 py-3 shadow-sm"><p className="flex items-center gap-2 text-sm font-extrabold text-[#0e2946]"><Map className="size-4 text-emerald-600" aria-hidden="true" />Illustrative demo map</p><p className="mt-1 text-xs leading-5 text-slate-600">Pins are illustrative, not actual school locations or distances.</p></div>
      {schools.slice(0, pageSize).map((school, index) => <Link key={school.slug} href={`/school/${school.slug}`} aria-label={`View ${school.name}, fees from ${formatNaira(school.feeFrom)}`} className="absolute z-10 -translate-x-1/2 rounded-xl bg-[#0e2946] px-3 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-700 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-emerald-600" style={{ left: `${positions[index][0]}%`, top: `${positions[index][1]}%` }}>{formatNaira(school.feeFrom)}<MapPin className="absolute left-1/2 top-full size-5 -translate-x-1/2 fill-emerald-600 text-white" aria-hidden="true" /></Link>)}
      {!schools.length && <p className="absolute inset-x-5 top-1/2 rounded-xl bg-white/95 p-4 text-center text-sm font-semibold text-slate-600">No sample schools match these filters.</p>}
      <p className="absolute inset-x-4 bottom-4 rounded-xl bg-white/95 px-4 py-2 text-center text-xs leading-5 text-slate-600">Select a pin to explore a sample school.</p>
    </section>
  );
}

function filterChips(filters: SchoolFilters): { label: string; patch: Partial<SchoolFilters> }[] {
  const chips: { label: string; patch: Partial<SchoolFilters> }[] = [];
  for (const key of ["q", "city", "area", "state"] as const) if (filters[key]) chips.push({ label: key === "q" ? `Search: ${filters[key]}` : filters[key], patch: { [key]: "" } });
  for (const key of ["level", "type", "curriculum", "verification", "facility"] as const) {
    for (const value of filters[key]) chips.push({ label: value.replaceAll("-", " "), patch: { [key]: filters[key].filter((item) => item !== value) } });
  }
  if (filters.minFee) chips.push({ label: `From ${formatNaira(Number(filters.minFee))}`, patch: { minFee: "" } });
  if (filters.maxFee) chips.push({ label: `Up to ${formatNaira(Number(filters.maxFee))}`, patch: { maxFee: "" } });
  if (filters.classSize) chips.push({ label: `Class size ≤ ${filters.classSize}`, patch: { classSize: "" } });
  if (filters.transport) chips.push({ label: "School transportation", patch: { transport: false } });
  if (filters.special) chips.push({ label: "Special-needs support", patch: { special: false } });
  return chips;
}

export function SearchResults({ schools, filters: initialFilters }: { schools: School[]; filters: SchoolFilters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filters, setOptimisticFilters] = useOptimistic(initialFilters);
  const results = useMemo(() => filterSchools(schools, filters), [schools, filters]);
  const shownResults = results.slice(0, filters.page * pageSize);
  const chips = filterChips(filters);
  const cities = [...new Set(schools.map((school) => school.city))];
  const suggestions = [...new Set(schools.flatMap((school) => [school.name, school.city, school.location.split(",")[0]]))];
  const locationName = [filters.area, filters.city, filters.state].filter(Boolean).join(", ");
  const demoData = schools.some((school) => school.isDemo);

  function update(patch: Partial<SchoolFilters>) {
    const next = { ...filters, page: 1, ...patch };
    const query = schoolSearchParams(next).toString();
    startTransition(() => {
      setOptimisticFilters(next);
      router.replace(`/schools${query ? `?${query}` : ""}`, { scroll: false });
    });
  }

  function reset() { update(parseSchoolFilters({})); }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update({ q: String(new FormData(event.currentTarget).get("q") ?? "").trim(), near: false });
  }

  return (
    <main id="main-content" className="pb-28 lg:pb-12">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1480px] px-5 py-5 sm:px-8 lg:px-10">
          <form role="search" onSubmit={submitSearch} className="flex max-w-3xl items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2">
            <Search className="ml-2 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <label htmlFor="results-query" className="sr-only">Search area, school or city</label>
            <input key={filters.q} id="results-query" name="q" type="search" defaultValue={filters.q} list="school-search-suggestions" maxLength={160} placeholder="Search area, school or city" className="h-11 min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm text-[#0e2946] outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:text-base" />
            <datalist id="school-search-suggestions">{suggestions.map((suggestion) => <option value={suggestion} key={suggestion} />)}</datalist>
            <Button type="submit" className="shrink-0 px-4 sm:px-5"><Search className="size-4 sm:hidden" aria-hidden="true" /><span className="sr-only sm:not-sr-only">Find schools</span></Button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-sm font-bold text-emerald-700">{locationName || "Find your school community"}</p><h1 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-[#0e2946] sm:text-3xl">Schools that fit your search</h1><p role="status" aria-live="polite" className="mt-2 text-sm text-slate-600">{results.length} {results.length === 1 ? `${demoData ? "sample " : ""}school` : `${demoData ? "sample " : ""}schools`}{pending ? " · Updating…" : demoData ? " · Demo results" : ""}</p></div>
          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto">
            <div aria-label="Results layout" className="flex rounded-xl border border-slate-300 bg-white p-1">
              <button type="button" onClick={() => update({ view: "list" })} aria-pressed={filters.view === "list"} className={cn("flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold", filters.view === "list" ? "bg-[#0e2946] text-white" : "text-slate-600 hover:bg-slate-100")}><List className="size-4" aria-hidden="true" /> List</button>
              <button type="button" onClick={() => update({ view: "map" })} aria-pressed={filters.view === "map"} className={cn("flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold", filters.view === "map" ? "bg-[#0e2946] text-white" : "text-slate-600 hover:bg-slate-100")}><Map className="size-4" aria-hidden="true" /> Map</button>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="sr-only sm:not-sr-only">Sort by</span><select aria-label="Sort schools" value={filters.sort} onChange={(event) => update({ sort: event.target.value as SchoolSort })} className="h-12 max-w-[180px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700"><option value="recommended">Recommended</option><option value="fees">Lowest fees</option><option value="rating">Highest rated</option><option value="class-size">Smallest classes</option><option value="name">School name</option></select></label>
          </div>
        </div>
        {demoData && <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-slate-600"><span className="font-bold text-[#0e2946]">You’re exploring sample schools.</span> Names, fees, ratings and verification labels demonstrate the experience. Photos are illustrative.</div>}
        {filters.near && <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">Nearby search needs verified map locations. For this demo, search by city or area to explore the sample schools in Ibadan.</div>}
        {chips.length > 0 && <div aria-label="Active filters" className="mb-5 flex flex-wrap items-center gap-2">{chips.map((chip, index) => <button key={`${chip.label}-${index}`} type="button" onClick={() => update(chip.patch)} aria-label={`Remove ${chip.label} filter`} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs font-bold capitalize text-emerald-900"><span className="truncate">{chip.label}</span><X className="size-3.5 shrink-0" aria-hidden="true" /></button>)}<button type="button" onClick={reset} className="min-h-10 px-2 text-sm font-bold text-emerald-700 underline underline-offset-4">Clear all</button></div>}
        <details className="group mb-5 rounded-2xl border border-slate-200 bg-white lg:hidden">
          <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#0e2946]"><span className="flex items-center gap-2"><SlidersHorizontal className="size-4" aria-hidden="true" /> Filters{chips.length > 0 && ` (${chips.length})`}</span><ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" /></summary>
          <div className="border-t border-slate-200 p-5"><FilterContent filters={filters} change={update} reset={reset} cities={cities} demoData={demoData} /></div>
        </details>
        <div className={cn("grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]", filters.view === "map" && "xl:grid-cols-[220px_minmax(420px,1fr)_minmax(320px,0.85fr)]")}>
          <aside aria-label="Filter schools" className="hidden lg:block"><div className="sticky top-24 max-h-[calc(100vh-112px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5"><FilterContent filters={filters} change={update} reset={reset} cities={cities} demoData={demoData} /></div></aside>
          <section aria-label="School results" aria-busy={pending} className="min-w-0 space-y-5">
            {filters.view === "map" && <div className="xl:hidden"><DemoMap schools={results} demoData={demoData} /></div>}
            {shownResults.length ? shownResults.map((school) => <SchoolCard key={school.slug} school={school} horizontal />) : <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center"><Search className="mx-auto size-9 text-emerald-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-extrabold text-[#0e2946]">No schools match just yet</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{demoData ? "Try a broader search or remove a filter. Our demo currently includes four sample schools in Ibadan." : "Try a broader search or remove a filter."}</p><Button type="button" onClick={reset} className="mt-6">Explore all {demoData ? "sample " : ""}schools <ArrowUpRight className="size-4" aria-hidden="true" /></Button></div>}
            {results.length > shownResults.length && <Button variant="outline" type="button" onClick={() => update({ page: filters.page + 1 })} className="w-full">Show more schools</Button>}
            {shownResults.length > 0 && <p className="py-3 text-center text-sm text-slate-500">Showing {shownResults.length} of {results.length} {demoData ? "sample " : ""}schools</p>}
          </section>
          {filters.view === "map" && <aside className="sticky top-24 hidden min-w-0 xl:block"><DemoMap schools={results} demoData={demoData} /></aside>}
        </div>
      </div>
    </main>
  );
}
