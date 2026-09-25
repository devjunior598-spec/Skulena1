import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchBox({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <form action="/schools" method="get" role="search" className={cn("flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_-22px_rgba(15,41,70,0.35)]", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-2 sm:px-3">
        <Search className="size-5 shrink-0 text-emerald-700" />
        <label htmlFor={compact ? "search-compact" : "search-main"} className="sr-only">Search area, school or city</label>
        <input id={compact ? "search-compact" : "search-main"} name="q" autoComplete="off" className="h-10 min-w-0 flex-1 rounded-md bg-transparent text-sm font-medium text-[#0e2946] outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500 sm:text-base" placeholder="Search area, school or city" />
      </div>
      <Button type="submit" size={compact ? "default" : "lg"} aria-label="Find schools">
        <Search className="size-4 sm:hidden" aria-hidden="true" /><span className="hidden sm:inline">Find schools</span>
      </Button>
    </form>
  );
}
