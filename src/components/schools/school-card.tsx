import Image from "next/image";
import Link from "next/link";
import { GraduationCap, MapPin } from "lucide-react";
import type { School } from "@/data/schools";
import { formatNaira } from "@/data/schools";
import { cn } from "@/lib/utils";
import { SaveSchoolButton } from "./school-actions";

export function SchoolCard({ school, horizontal = false, compact = false }: { school: School; horizontal?: boolean; compact?: boolean }) {
  const initials = (school.shortName || school.name).trim().split(/[\s-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
  return (
    <article className={cn("group relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_44px_-28px_rgba(15,41,70,0.42)]", horizontal && "sm:grid sm:grid-cols-[220px_1fr]")}>
      <div className={cn("relative overflow-hidden bg-slate-100", horizontal ? "aspect-[4/3] sm:aspect-auto sm:min-h-57" : compact ? "aspect-[16/9]" : "aspect-[4/3]")}>
        {school.image ? <Image src={school.image} alt={`${school.name} school media`} fill sizes={horizontal ? "(max-width: 640px) 100vw, 220px" : compact ? "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div aria-label="School photo not available" className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-100"><GraduationCap className={cn("text-emerald-800/70", compact ? "size-10" : "size-14")} aria-hidden="true" /></div>}
        <SaveSchoolButton slug={school.slug} name={school.name} iconOnly className={cn("absolute z-20 rounded-full border-0 bg-white/95 shadow-sm", compact ? "right-2 top-2 size-9" : "right-3 top-3 size-10")} />
      </div>
      <div className={cn("p-4.5 sm:p-5", compact && "p-3 sm:p-3.5")}>
        <div className={cn("flex items-start gap-3", compact && "gap-2.5")}>
          {school.logo ? <span className={cn("relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white", compact ? "size-11" : "size-12")}><Image src={school.logo} alt="" aria-hidden="true" fill sizes={compact ? "44px" : "48px"} className="object-contain p-1.5" /></span> : <span aria-label={`${school.name} logo not uploaded`} className={cn("grid shrink-0 place-items-center rounded-xl bg-emerald-50 font-extrabold tracking-wide text-emerald-900", compact ? "size-11 text-xs" : "size-12 text-sm")}>{initials}</span>}
          <div className="min-w-0 flex-1">
            {school.location && <p className="flex items-center gap-1 text-xs font-medium text-slate-500"><MapPin className="size-3.5 shrink-0 text-emerald-600" />{school.location}</p>}
            <h3 className={cn("mt-2 text-lg font-extrabold leading-tight tracking-[-0.025em] text-[#0e2946]", compact && "mt-1 text-sm leading-snug")}><Link href={`/school/${school.slug}`} className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:rounded-[1.35rem] focus-visible:after:ring-4 focus-visible:after:ring-inset focus-visible:after:ring-emerald-500">{school.name}</Link></h3>
          </div>
        </div>
        <div className={cn("mt-3 flex flex-wrap gap-1.5", compact && "mt-2 gap-1")}>
          {school.levels.slice(0, compact ? 2 : school.levels.length).map((level) => <span key={level} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{level}</span>)}
          {compact && school.levels.length > 2 && <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">+{school.levels.length - 2}</span>}
          {school.type && <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{school.type}</span>}
        </div>
        <div className={cn("mt-4 flex items-end justify-between border-t border-slate-100 pt-4", compact && "mt-3 pt-3")}>
          <div><p className="text-[11px] font-semibold text-slate-500">Tuition listed</p><p className={cn("text-base font-extrabold text-[#0e2946]", compact && "text-sm")}>{school.feeFrom > 0 ? formatNaira(school.feeFrom) : "Not provided"}</p></div>
          <p className="text-xs font-semibold text-slate-500">{school.city}</p>
        </div>
      </div>
    </article>
  );
}
