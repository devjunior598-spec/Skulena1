import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, FileCheck2, GraduationCap, MapPin } from "lucide-react";
import type { School } from "@/data/schools";
import { formatNaira } from "@/data/schools";
import { cn } from "@/lib/utils";
import { SaveSchoolButton } from "./school-actions";

function VerificationMarker({ school }: { school: School }) {
  if (school.verification === "school-provided") return null;
  const physicallyChecked = school.verification === "physically-verified";
  const Icon = physicallyChecked ? BadgeCheck : FileCheck2;
  const label = physicallyChecked ? "On-site check recorded" : "Documents reviewed";
  return <span className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-[#123a32] shadow-sm backdrop-blur"><Icon className="size-3.5 shrink-0 text-emerald-800" aria-hidden="true" />{label}<span className="sr-only">for some school information; see the profile for details</span></span>;
}

export function SchoolCard({ school, horizontal = false, initialSaved, showSave = true, headingLevel = 2 }: {
  school: School;
  horizontal?: boolean;
  initialSaved?: boolean;
  showSave?: boolean;
  headingLevel?: 2 | 3;
}) {
  const initials = (school.shortName || school.name).trim().split(/[\s-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
  const location = school.location || school.city;
  const visibleLevels = school.levels.slice(0, 3);
  const remainingLevels = school.levels.length - visibleLevels.length;
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <article className={cn("group relative w-full max-w-[25rem] overflow-hidden rounded-[1.5rem] border border-slate-200/90 bg-white shadow-[0_8px_28px_-22px_rgba(15,41,70,0.55)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_22px_45px_-28px_rgba(15,41,70,0.4)]", horizontal && "max-w-none sm:grid sm:grid-cols-[250px_minmax(0,1fr)]")}>
      <div className={cn("relative overflow-hidden bg-[#e9f1eb]", horizontal ? "aspect-[16/9] sm:aspect-auto sm:min-h-[220px]" : "aspect-[16/10]")}>
        {school.image ? <Image src={school.image} alt={school.imageAlt || `Campus photo for ${school.name}`} fill sizes={horizontal ? "(max-width: 640px) 100vw, 250px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"} className="object-cover transition duration-500 group-hover:scale-[1.035]" /> : (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 bg-[radial-gradient(circle_at_20%_20%,#ffffff_0,transparent_40%),linear-gradient(135deg,#e0efe5,#edf4f8)] px-4 text-center">
            <span className="grid size-14 place-items-center rounded-2xl border border-white/80 bg-white/80 text-emerald-900 shadow-sm"><GraduationCap className="size-7" aria-hidden="true" /></span>
            <span className="text-xs font-bold text-slate-600">{school.hasApprovedCover ? "Photo temporarily unavailable" : "No approved cover photo"}</span>
          </div>
        )}
        {showSave && <SaveSchoolButton slug={school.slug} name={school.name} iconOnly initialSaved={initialSaved} className="absolute right-3 top-3 z-20 size-11 rounded-full border border-white/80 bg-white/95 text-[#0e2946] shadow-sm backdrop-blur hover:border-rose-200 hover:bg-white hover:text-rose-600" />}
        <VerificationMarker school={school} />
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          {school.logo ? (
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <Image src={school.logo} alt={`${school.name} logo`} fill sizes="48px" className="object-contain p-1" />
            </span>
          ) : (
            <span aria-label={`${school.name} logo not uploaded`} className="grid size-12 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-xs font-black tracking-wide text-emerald-900">{initials}</span>
          )}
          <div className="min-w-0 flex-1">
            {location && <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MapPin className="size-3.5 shrink-0 text-emerald-700" aria-hidden="true" /><span className="truncate">{location}</span></p>}
            <Heading className="mt-1.5 line-clamp-2 text-base font-extrabold leading-snug tracking-[-0.025em] text-[#0e2946] sm:text-[1.05rem]">
              <Link href={`/school/${school.slug}`} className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:rounded-[1.5rem] focus-visible:after:ring-4 focus-visible:after:ring-inset focus-visible:after:ring-emerald-600">{school.name}</Link>
            </Heading>
          </div>
        </div>

        {(visibleLevels.length > 0 || school.type) && <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
          {visibleLevels.map((level) => <span key={level} className="inline-flex min-h-7 items-center rounded-full border border-emerald-100 bg-[#f2f8f3] px-2.5 py-1 text-[11px] font-bold text-[#245b46]">{level}</span>)}
          {remainingLevels > 0 && <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">+{remainingLevels}</span>}
          {school.type && <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">{school.type}</span>}
        </div>}

        <div className="mt-4 flex min-h-[52px] items-end justify-between gap-3 border-t border-slate-100 pt-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500">{school.feePublished ? "Tuition from" : "Fees"}</p>
            <p className="mt-0.5 truncate text-sm font-extrabold text-[#0e2946]">{school.feePublished ? formatNaira(school.feeFrom) : "Not published"}</p>
          </div>
          {school.schoolType && <span className="max-w-[45%] truncate rounded-full bg-[#f2f5f8] px-2.5 py-1.5 text-[10px] font-bold text-slate-600">{school.schoolType}</span>}
        </div>
      </div>
    </article>
  );
}
