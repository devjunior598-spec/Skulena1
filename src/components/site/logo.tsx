import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="Skulena home">
      <span className="grid size-9 place-items-center rounded-[11px] bg-emerald-600 shadow-sm shadow-emerald-800/15">
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" aria-hidden="true">
          <path d="M5 7.5 12 4l7 3.5-7 3.5-7-3.5Z" fill="currentColor" />
          <path d="M7.5 10.5V15c0 1.1 2 2.5 4.5 2.5s4.5-1.4 4.5-2.5v-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M19 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && <span className="text-[1.35rem] font-extrabold tracking-[-0.045em] text-[#0e2946]">skulena</span>}
    </Link>
  );
}
