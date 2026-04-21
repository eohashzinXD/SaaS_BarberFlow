import { FlashMessage } from "@/components/flash-message";
import { SectionHeader } from "@/components/section-header";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BillingStatus } from "@prisma/client";
import { getWeekdayLabel } from "@/lib/formatters";
import { openBillingPortalAction } from "@/server/actions/billing";
import { getBillingStatusLabel, isBillingActive } from "@/server/billing/status";
import { getFlashFromSearchParams } from "@/lib/navigation";
import {
  updateBusinessHoursAction,
  updateSettingsAction
} from "@/server/actions/settings";
import { requireTenantSession } from "@/server/auth/tenant-session";
import { getTenantSettings } from "@/server/settings";

type SettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const session = await requireTenantSession();
  const tenant = await getTenantSettings(session.tenantId);
  const billingIsActive = tenant
    ? isBillingActive(tenant.billingStatus, tenant.subscriptionCurrentPeriodEnd)
    : false;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Configurações"
        description="Edite os dados públicos da barbearia e o horário de funcionamento."
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados públicos</CardTitle>
          <CardDescription>Esses dados aparecem na página pública da barbearia.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSettingsAction} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da barbearia</Label>
              <Input defaultValue={tenant?.name ?? ""} id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input defaultValue={tenant?.slug ?? ""} id="slug" name="slug" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input defaultValue={tenant?.profile?.phone ?? ""} id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input defaultValue={tenant?.profile?.address ?? ""} id="address" name="address" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                defaultValue={tenant?.profile?.description ?? ""}
                id="description"
                name="description"
              />
            </div>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="Salvando dados...">Salvar alterações</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Controle a assinatura que libera o acesso ao SaaS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status atual:</strong>{" "}
              {getBillingStatusLabel(
                tenant?.billingStatus ?? BillingStatus.PENDING_PAYMENT,
                tenant?.subscriptionCurrentPeriodEnd
              )}
            </p>
            {tenant?.subscriptionCurrentPeriodEnd ? (
              <p>
                <strong className="text-foreground">Próxima renovação:</strong>{" "}
                {tenant.subscriptionCurrentPeriodEnd.toLocaleDateString("pt-BR")}
              </p>
            ) : null}
          </div>
          {!billingIsActive ? (
            <form action={openBillingPortalAction}>
              <SubmitButton pendingLabel="Redirecionando para pagamento...">
                Regularizar assinatura
              </SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              A assinatura está ativa. Se quiser alterar o plano ou cancelar, faça isso pelo painel do AbacatePay.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horários de funcionamento</CardTitle>
          <CardDescription>
            Deixe um dia em branco para marcá-lo como fechado no fluxo de booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateBusinessHoursAction} className="space-y-4">
            {Array.from({ length: 7 }, (_, weekday) => {
              const hour = tenant?.businessHours.find((item) => item.weekday === weekday);

              return (
                <div
                  key={weekday}
                  className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-[160px_1fr_1fr]"
                >
                  <div className="self-center text-sm font-semibold">{getWeekdayLabel(weekday)}</div>
                  <div className="space-y-2">
                    <Label htmlFor={`startTime-${weekday}`}>Abertura</Label>
                    <Input
                      defaultValue={hour?.startTime ?? ""}
                      id={`startTime-${weekday}`}
                      name={`startTime-${weekday}`}
                      type="time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`endTime-${weekday}`}>Fechamento</Label>
                    <Input
                      defaultValue={hour?.endTime ?? ""}
                      id={`endTime-${weekday}`}
                      name={`endTime-${weekday}`}
                      type="time"
                    />
                  </div>
                </div>
              );
            })}
            <SubmitButton pendingLabel="Salvando horários...">Salvar horários</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
