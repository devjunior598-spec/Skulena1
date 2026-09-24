import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>}
      <h2 className="text-balance text-3xl font-extrabold tracking-[-0.035em] text-[#0e2946] sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-pretty text-base leading-7 text-slate-600 sm:text-lg">{description}</p>}
    </div>
  );
}
