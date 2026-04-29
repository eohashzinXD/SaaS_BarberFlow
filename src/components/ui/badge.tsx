import { AppointmentStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100",
  CONFIRMED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
  CANCELED: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
  DONE: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
};

export function StatusBadge({
  status,
  label
}: {
  status: AppointmentStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {label}
    </span>
  );
}
