import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchBox({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <form action="/schools" method="get" role="search" className={cn("flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_-22px_rgba(15,41,70,0.35)]", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-2 sm:px-3">
        <Search className="size-5 shrink-0 text-emerald-700" />
        <label htmlFor={compact ? "search-compact" : "search-main"} className="sr-only">Search area, school or city</label>
        <input id={compact ? "search-compact" : "search-main"} name="q" type="search" autoComplete="off" maxLength={160} className="h-11 min-w-0 flex-1 rounded-md bg-transparent text-sm font-medium text-[#0e2946] outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500 sm:text-base" placeholder="Search area, school or city" />
      </div>
      <Button type="submit" size={compact ? "default" : "lg"} aria-label="Find schools" className={compact ? "" : "px-3 text-xs sm:px-5 sm:text-sm"}>
        <Search className="hidden size-4 sm:block" aria-hidden="true" /><span>Find schools</span>
      </Button>
    </form>
  );
}
