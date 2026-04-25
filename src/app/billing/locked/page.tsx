import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { getBillingStatusLabel, getTenantAccessMessage } from "@/server/billing/status";
import { openBillingPortalAction } from "@/server/actions/billing";
import { requireAnyTenantSession } from "@/server/auth/tenant-session";
import { prisma } from "@/lib/prisma";

type BillingLockedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BillingLockedPage({ searchParams }: BillingLockedPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const session = await requireAnyTenantSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      name: true,
      billingStatus: true,
      subscriptionCurrentPeriodEnd: true,
      gracePeriodDays: true,
      isBlocked: true,
      blockedReason: true
    }
  });

  if (!tenant) {
    notFound();
  }

  const accessMessage = session.isBlocked
    ? "Seu usuário está bloqueado. Fale com o responsável da plataforma."
    : getTenantAccessMessage(tenant);
  const canOpenBilling = !session.isBlocked && !tenant.isBlocked;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <div className="w-full space-y-6">
        {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
        <FlashMessage message={accessMessage} type="error" />
        <Card>
          <CardHeader>
            <CardTitle>{tenant.isBlocked ? "Acesso bloqueado" : "Acesso bloqueado por billing"}</CardTitle>
            <CardDescription>
              A barbearia {tenant.name} está com o status{" "}
              {getBillingStatusLabel(
                tenant.billingStatus,
                tenant.subscriptionCurrentPeriodEnd,
                tenant.gracePeriodDays
              ).toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{accessMessage}</p>
            {tenant.blockedReason ? (
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Motivo informado:</strong> {tenant.blockedReason}
              </p>
            ) : null}
            {tenant.subscriptionCurrentPeriodEnd ? (
              <p className="text-sm text-muted-foreground">
                Último vencimento registrado:{" "}
                {tenant.subscriptionCurrentPeriodEnd.toLocaleDateString("pt-BR")}
              </p>
            ) : null}
            {canOpenBilling ? (
              <form action={openBillingPortalAction}>
                <SubmitButton pendingLabel="Redirecionando para pagamento..." type="submit">
                  Ir para pagamento
                </SubmitButton>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este bloqueio precisa ser liberado por um Super Admin da plataforma.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
