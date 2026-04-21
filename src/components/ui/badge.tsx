import { AppointmentStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  CANCELED: "bg-rose-100 text-rose-900",
  DONE: "bg-slate-200 text-slate-900"
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
