import { BillingStatus } from "@prisma/client";
import { addDays, addMonths, differenceInCalendarDays } from "date-fns";

export const SUBSCRIPTION_WARNING_DAYS = 5;

type TenantAccessParams = {
  billingStatus: BillingStatus;
  subscriptionCurrentPeriodEnd?: Date | null;
  gracePeriodDays?: number;
  isBlocked?: boolean;
};

export type TenantPlatformStatus =
  | "ACTIVE"
  | "EXPIRING"
  | "BLOCKED"
  | "EXPIRED"
  | "PENDING_PAYMENT"
  | "CANCELED";

export function getNextSubscriptionPeriodEnd(referenceDate = new Date()) {
  return addMonths(referenceDate, 1);
}

export function getEffectiveSubscriptionEnd(
  subscriptionCurrentPeriodEnd?: Date | null,
  gracePeriodDays = 0
) {
  if (!subscriptionCurrentPeriodEnd) {
    return null;
  }

  return addDays(subscriptionCurrentPeriodEnd, Math.max(0, gracePeriodDays));
}

export function getSubscriptionDaysRemaining(
  subscriptionCurrentPeriodEnd?: Date | null,
  gracePeriodDays = 0,
  referenceDate = new Date()
) {
  const effectiveEnd = getEffectiveSubscriptionEnd(subscriptionCurrentPeriodEnd, gracePeriodDays);

  if (!effectiveEnd) {
    return null;
  }

  return differenceInCalendarDays(effectiveEnd, referenceDate);
}

export function hasBillingPeriodEnded(
  subscriptionCurrentPeriodEnd?: Date | null,
  gracePeriodDays = 0
) {
  const effectiveEnd = getEffectiveSubscriptionEnd(subscriptionCurrentPeriodEnd, gracePeriodDays);

  if (!effectiveEnd) {
    return true;
  }

  return effectiveEnd.getTime() <= Date.now();
}

export function isBillingActive(
  status: BillingStatus,
  subscriptionCurrentPeriodEnd?: Date | null,
  gracePeriodDays = 0
) {
  return status === BillingStatus.ACTIVE && !hasBillingPeriodEnded(subscriptionCurrentPeriodEnd, gracePeriodDays);
}

export function isTenantBlocked(isBlocked?: boolean) {
  return Boolean(isBlocked);
}

export function isTenantAccessAllowed(params: TenantAccessParams) {
  return !isTenantBlocked(params.isBlocked) && isBillingActive(
    params.billingStatus,
    params.subscriptionCurrentPeriodEnd,
    params.gracePeriodDays
  );
}

export function getTenantPlatformStatus(
  params: TenantAccessParams,
  warningDays = SUBSCRIPTION_WARNING_DAYS
): TenantPlatformStatus {
  if (isTenantBlocked(params.isBlocked)) {
    return "BLOCKED";
  }

  if (params.billingStatus === BillingStatus.CANCELED) {
    return "CANCELED";
  }

  if (params.billingStatus === BillingStatus.PENDING_PAYMENT) {
    return "PENDING_PAYMENT";
  }

  if (!isBillingActive(
    params.billingStatus,
    params.subscriptionCurrentPeriodEnd,
    params.gracePeriodDays
  )) {
    return "EXPIRED";
  }

  const remainingDays = getSubscriptionDaysRemaining(
    params.subscriptionCurrentPeriodEnd,
    params.gracePeriodDays
  );

  if (remainingDays !== null && remainingDays <= warningDays) {
    return "EXPIRING";
  }

  return "ACTIVE";
}

export function getTenantPlatformStatusLabel(status: TenantPlatformStatus) {
  const labels: Record<TenantPlatformStatus, string> = {
    ACTIVE: "Ativa",
    EXPIRING: "Vencendo em breve",
    BLOCKED: "Bloqueada",
    EXPIRED: "Vencida",
    PENDING_PAYMENT: "Pendente",
    CANCELED: "Cancelada"
  };

  return labels[status];
}

export function getTenantAccessMessage(
  params: TenantAccessParams & {
    blockedReason?: string | null;
  }
) {
  if (isTenantBlocked(params.isBlocked)) {
    return params.blockedReason?.trim()
      ? `A barbearia está bloqueada. Motivo: ${params.blockedReason.trim()}`
      : "A barbearia está bloqueada no momento. Fale com o suporte da plataforma.";
  }

  if (params.billingStatus === BillingStatus.ACTIVE) {
    return "Sua assinatura venceu. Regularize a cobrança para voltar ao painel.";
  }

  if (params.billingStatus === BillingStatus.PAST_DUE) {
    return "Sua assinatura está com pagamento pendente. Regularize a cobrança para voltar ao painel.";
  }

  if (params.billingStatus === BillingStatus.CANCELED) {
    return "Sua assinatura foi cancelada. Reative o plano para acessar o painel.";
  }

  return "Sua conta ainda não foi ativada. Conclua o pagamento para liberar o acesso.";
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
  subscriptionCurrentPeriodEnd?: Date | null,
  gracePeriodDays = 0
) {
  if (status === BillingStatus.ACTIVE && hasBillingPeriodEnded(subscriptionCurrentPeriodEnd, gracePeriodDays)) {
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
