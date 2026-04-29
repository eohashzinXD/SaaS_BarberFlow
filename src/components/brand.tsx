import { cn } from "@/lib/utils";

type BrandProps = {
  compact?: boolean;
  subtitle?: string;
  tone?: "default" | "light";
  className?: string;
};

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(94,170,255,0.5),_transparent_55%),linear-gradient(135deg,_hsl(var(--primary))_0%,_hsl(var(--accent))_100%)] shadow-[0_18px_48px_rgba(17,24,39,0.18)]",
        className
      )}
    >
      <span className="absolute inset-[1px] rounded-[calc(1rem-1px)] bg-[linear-gradient(155deg,rgba(255,255,255,0.22),rgba(255,255,255,0.03))]" />
      <span className="relative flex h-full w-full items-center justify-center text-sm font-black uppercase tracking-[0.22em] text-white">
        N
      </span>
    </span>
  );
}

export function BrandLockup({
  compact = false,
  subtitle,
  tone = "default",
  className
}: BrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark className={compact ? "h-9 w-9 rounded-xl" : undefined} />
      <div className="min-w-0">
        <p
          className={cn(
            "font-display text-lg font-semibold tracking-[0.18em]",
            tone === "light" ? "text-white" : "text-foreground",
            compact && "text-base"
          )}
        >
          NEXORA
        </p>
        {subtitle ? (
          <p className={cn("text-xs", tone === "light" ? "text-slate-200" : "text-muted-foreground")}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
