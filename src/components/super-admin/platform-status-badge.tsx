import { cn } from "@/lib/utils";
import {
  getTenantPlatformStatusLabel,
  type TenantPlatformStatus
} from "@/server/billing/status";

const tones: Record<TenantPlatformStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-900",
  EXPIRING: "bg-amber-100 text-amber-900",
  BLOCKED: "bg-rose-100 text-rose-900",
  EXPIRED: "bg-orange-100 text-orange-900",
  PENDING_PAYMENT: "bg-slate-200 text-slate-900",
  CANCELED: "bg-zinc-200 text-zinc-900"
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
