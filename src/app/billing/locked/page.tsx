import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { getBillingStatusLabel } from "@/server/billing/status";
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
      subscriptionCurrentPeriodEnd: true
    }
  });

  if (!tenant) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <div className="w-full space-y-6">
        {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
        <FlashMessage
          message="O acesso ao painel está bloqueado até a assinatura ficar ativa novamente."
          type="error"
        />
        <Card>
          <CardHeader>
            <CardTitle>Acesso bloqueado por billing</CardTitle>
            <CardDescription>
              A barbearia {tenant.name} está com o status{" "}
              {getBillingStatusLabel(
                tenant.billingStatus,
                tenant.subscriptionCurrentPeriodEnd
              ).toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gere um novo checkout para regularizar a assinatura e liberar o painel novamente.
            </p>
            {tenant.subscriptionCurrentPeriodEnd ? (
              <p className="text-sm text-muted-foreground">
                Último vencimento registrado:{" "}
                {tenant.subscriptionCurrentPeriodEnd.toLocaleDateString("pt-BR")}
              </p>
            ) : null}
            <form action={openBillingPortalAction}>
              <SubmitButton pendingLabel="Redirecionando para pagamento..." type="submit">
                Ir para pagamento
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
