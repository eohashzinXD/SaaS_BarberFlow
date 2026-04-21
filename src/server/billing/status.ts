import { BillingStatus } from "@prisma/client";
import { addMonths } from "date-fns";

export function getNextSubscriptionPeriodEnd(referenceDate = new Date()) {
  return addMonths(referenceDate, 1);
}

export function hasBillingPeriodEnded(subscriptionCurrentPeriodEnd?: Date | null) {
  if (!subscriptionCurrentPeriodEnd) {
    return true;
  }

  return subscriptionCurrentPeriodEnd.getTime() <= Date.now();
}

export function isBillingActive(
  status: BillingStatus,
  subscriptionCurrentPeriodEnd?: Date | null
) {
  return status === BillingStatus.ACTIVE && !hasBillingPeriodEnded(subscriptionCurrentPeriodEnd);
}

export function mapSubscriptionStatus(status: string | null | undefined): BillingStatus {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
    case "COMPLETED":
    case "TRIALING":
    case "RENEWED":
      return BillingStatus.ACTIVE;
    case "PAST_DUE":
    case "UNPAID":
    case "INCOMPLETE":
    case "INCOMPLETE_EXPIRED":
      return BillingStatus.PAST_DUE;
    case "CANCELED":
    case "CANCELLED":
      return BillingStatus.CANCELED;
    default:
      return BillingStatus.PENDING_PAYMENT;
  }
}

export function getBillingStatusLabel(
  status: BillingStatus,
  subscriptionCurrentPeriodEnd?: Date | null
) {
  if (status === BillingStatus.ACTIVE && hasBillingPeriodEnded(subscriptionCurrentPeriodEnd)) {
    return "Assinatura vencida";
  }

  const labels: Record<BillingStatus, string> = {
    PENDING_PAYMENT: "Pagamento pendente",
    ACTIVE: "Assinatura ativa",
    PAST_DUE: "Pagamento pendente",
    CANCELED: "Assinatura cancelada"
  };

  return labels[status];
}
