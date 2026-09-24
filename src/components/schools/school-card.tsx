import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { School } from "@/data/schools";
import { formatNaira } from "@/data/schools";
import { VerificationBadge } from "./verification-badge";
import { cn } from "@/lib/utils";
import { SaveSchoolButton } from "./school-actions";

export function SchoolCard({ school, horizontal = false }: { school: School; horizontal?: boolean }) {
  return (
    <article className={cn("group relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_44px_-28px_rgba(15,41,70,0.42)]", horizontal && "sm:grid sm:grid-cols-[220px_1fr]")}>
      <div className={cn("relative aspect-[4/3] overflow-hidden bg-slate-100", horizontal && "sm:aspect-auto sm:min-h-57")}>
        <Image src={school.image} alt={school.isDemo ? `Illustrative stock photograph for the ${school.name} demo listing` : `${school.name} school media`} fill sizes={horizontal ? "(max-width: 640px) 100vw, 220px" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3"><VerificationBadge level={school.verification} short /></div>
        <SaveSchoolButton slug={school.slug} name={school.name} iconOnly className="absolute right-3 top-3 z-20 size-10 rounded-full border-0 bg-white/95 shadow-sm" />
        <span className="absolute bottom-3 left-3 rounded-md bg-slate-950/65 px-2 py-1 text-[10px] font-semibold text-white">{school.isDemo ? "Demo school · Stock photo" : "Published school"}</span>
      </div>
      <div className="p-4.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-slate-500"><MapPin className="size-3.5 text-emerald-600" />{school.location}</p>
            <h3 className="mt-2 text-lg font-extrabold leading-tight tracking-[-0.025em] text-[#0e2946]"><Link href={`/school/${school.slug}`} className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:rounded-[1.35rem] focus-visible:after:ring-4 focus-visible:after:ring-inset focus-visible:after:ring-emerald-500">{school.name}</Link></h3>
          </div>
          {school.rating > 0 && <span className="flex shrink-0 flex-col items-end gap-0.5 text-sm font-extrabold text-[#0e2946]"><span className="flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />{school.rating}</span><span className="text-[9px] font-semibold text-slate-500">{school.isDemo ? "Demo rating" : "Parent rating"}</span></span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {school.levels.map((level) => <span key={level} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{level}</span>)}
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{school.type}</span>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
          <div><p className="text-[11px] font-semibold text-slate-500">{school.isDemo ? "Sample fees from / term" : "Fees from / term"}</p><p className="text-base font-extrabold text-[#0e2946]">{school.feeFrom > 0 ? formatNaira(school.feeFrom) : "Ask school"}</p></div>
          <p className="text-xs font-semibold text-slate-500">{school.city}</p>
        </div>
      </div>
    </article>
  );
}
