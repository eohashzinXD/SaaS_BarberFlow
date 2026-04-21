import { BillingStatus } from "@prisma/client";

import {
  getBillingStatusLabel,
  getNextSubscriptionPeriodEnd,
  hasBillingPeriodEnded,
  isBillingActive
} from "@/server/billing/status";

describe("billing status rules", () => {
  it("considers an active subscription valid while the current period is in the future", () => {
    const currentPeriodEnd = getNextSubscriptionPeriodEnd(new Date());

    expect(isBillingActive(BillingStatus.ACTIVE, currentPeriodEnd)).toBe(true);
    expect(getBillingStatusLabel(BillingStatus.ACTIVE, currentPeriodEnd)).toBe(
      "Assinatura ativa"
    );
  });

  it("blocks access when the current period has expired", () => {
    const currentPeriodEnd = new Date(Date.now() - 60_000);

    expect(hasBillingPeriodEnded(currentPeriodEnd)).toBe(true);
    expect(isBillingActive(BillingStatus.ACTIVE, currentPeriodEnd)).toBe(false);
    expect(getBillingStatusLabel(BillingStatus.ACTIVE, currentPeriodEnd)).toBe(
      "Assinatura vencida"
    );
  });

  it("blocks access when there is no current period end recorded", () => {
    expect(isBillingActive(BillingStatus.ACTIVE, null)).toBe(false);
    expect(getBillingStatusLabel(BillingStatus.ACTIVE, null)).toBe("Assinatura vencida");
  });
});
