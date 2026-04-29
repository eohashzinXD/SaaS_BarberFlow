import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "emerald" | "amber";
  className?: string;
};

const accents = {
  primary:
    "before:bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_65%)]",
  emerald:
    "before:bg-[radial-gradient(circle,rgba(16,185,129,0.16),transparent_65%)]",
  amber:
    "before:bg-[radial-gradient(circle,rgba(245,158,11,0.16),transparent_65%)]"
};

export function MetricCard({
  label,
  value,
  hint,
  accent = "primary",
  className
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.6rem] border border-border/[0.8] bg-card/[0.92] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] before:absolute before:right-[-10%] before:top-[-25%] before:h-32 before:w-32 before:rounded-full",
        accents[accent],
        className
      )}
    >
      <div className="relative space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="font-display text-4xl font-semibold tracking-tight text-foreground">{value}</p>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
