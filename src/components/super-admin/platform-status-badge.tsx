import { cn } from "@/lib/utils";
import {
  getTenantPlatformStatusLabel,
  type TenantPlatformStatus
} from "@/server/billing/status";

const tones: Record<TenantPlatformStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
  EXPIRING: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100",
  BLOCKED: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
  EXPIRED: "bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-100",
  PENDING_PAYMENT: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
  CANCELED: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
};

type PlatformStatusBadgeProps = {
  status: TenantPlatformStatus;
  label?: string;
  className?: string;
};

export function PlatformStatusBadge({
  status,
  label,
  className
}: PlatformStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[status],
        className
      )}
    >
      {label ?? getTenantPlatformStatusLabel(status)}
    </span>
  );
}
