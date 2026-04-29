import Link from "next/link";
import { notFound } from "next/navigation";
import { BillingStatus, Role } from "@prisma/client";

import { ConfirmButton } from "@/components/confirm-button";
import { FlashMessage } from "@/components/flash-message";
import { SectionHeader } from "@/components/section-header";
import { PlatformStatusBadge } from "@/components/super-admin/platform-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateInput } from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import {
  blockSuperAdminBarbershopAction,
  deleteSuperAdminBarbershopAction,
  unblockSuperAdminBarbershopAction,
  updateSuperAdminBarbershopAction,
  updateSuperAdminBarbershopSubscriptionAction
} from "@/server/actions/super-admin";
import { getSuperAdminBarbershopDetail } from "@/server/super-admin";

const billingStatusOptions = [
  { value: BillingStatus.ACTIVE, label: "Ativa" },
  { value: BillingStatus.PAST_DUE, label: "Em atraso" },
  { value: BillingStatus.PENDING_PAYMENT, label: "Pendente" },
  { value: BillingStatus.CANCELED, label: "Cancelada" }
] as const;

type SuperAdminBarbershopDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SuperAdminBarbershopDetailPage({
  params,
  searchParams
}: SuperAdminBarbershopDetailPageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const flash = getFlashFromSearchParams(search);
  const tenant = await getSuperAdminBarbershopDetail(id);

  if (!tenant) {
    notFound();
  }

  const redirectTo = `/super-admin/barbershops/${tenant.id}`;
  const responsibleUser =
    tenant.users.find((user) => user.role === Role.ADMIN) ?? tenant.users[0] ?? null;

  return (
    <div className="space-y-8">
      <SectionHeader
        title={tenant.name}
        description={`Tenant ${tenant.slug} com visão operacional, cobrança e histórico administrativo.`}
        actions={
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/super-admin/barbershops">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/super-admin/users">Ver usuários</Link>
            </Button>
          </div>
        }
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status atual</CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformStatusBadge status={tenant.platformStatus} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mensalidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {tenant.subscriptionDaysRemaining === null ? "-" : tenant.subscriptionDaysRemaining}
            </p>
            <p className="text-sm text-muted-foreground">dias restantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estrutura</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tenant._count.barbers}</p>
            <p className="text-sm text-muted-foreground">{tenant._count.services} serviços</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tenant._count.appointments}</p>
            <p className="text-sm text-muted-foreground">{tenant._count.users} usuários vinculados</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados principais</CardTitle>
              <CardDescription>Edite dados da barbearia e do responsável principal.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateSuperAdminBarbershopAction} className="grid gap-5 md:grid-cols-2">
                <input name="tenantId" type="hidden" value={tenant.id} />
                <input name="redirectTo" type="hidden" value={redirectTo} />
                {responsibleUser ? (
                  <input name="ownerUserId" type="hidden" value={responsibleUser.id} />
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="name">Nome da barbearia</Label>
                  <Input defaultValue={tenant.name} id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input defaultValue={tenant.slug} id="slug" name="slug" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input defaultValue={tenant.profile?.phone ?? ""} id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input defaultValue={tenant.profile?.address ?? ""} id="address" name="address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Responsável</Label>
                  <Input
                    defaultValue={responsibleUser?.name ?? ""}
                    id="ownerName"
                    name="ownerName"
                    placeholder="Sem responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">E-mail do responsável</Label>
                  <Input
                    defaultValue={responsibleUser?.email ?? ""}
                    id="ownerEmail"
                    name="ownerEmail"
                    placeholder="Sem e-mail"
                    type="email"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    defaultValue={tenant.profile?.description ?? ""}
                    id="description"
                    name="description"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Salvar alterações</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assinatura e cobrança</CardTitle>
              <CardDescription>Controle status, vencimento e carência deste tenant.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={updateSuperAdminBarbershopSubscriptionAction}
                className="grid gap-5 md:grid-cols-2"
              >
                <input name="tenantId" type="hidden" value={tenant.id} />
                <input name="redirectTo" type="hidden" value={redirectTo} />

                <div className="space-y-2">
                  <Label htmlFor="billingStatus">Status da assinatura</Label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={tenant.billingStatus}
                    id="billingStatus"
                    name="billingStatus"
                  >
                    {billingStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Carência (dias)</Label>
                  <Input
                    defaultValue={tenant.gracePeriodDays}
                    id="gracePeriodDays"
                    min={0}
                    name="gracePeriodDays"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionStartDate">Início da assinatura</Label>
                  <Input
                    defaultValue={
                      tenant.subscriptionStartDate ? formatDateInput(tenant.subscriptionStartDate) : ""
                    }
                    id="subscriptionStartDate"
                    name="subscriptionStartDate"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionCurrentPeriodEnd">Vencimento</Label>
                  <Input
                    defaultValue={
                      tenant.subscriptionCurrentPeriodEnd
                        ? formatDateInput(tenant.subscriptionCurrentPeriodEnd)
                        : ""
                    }
                    id="subscriptionCurrentPeriodEnd"
                    name="subscriptionCurrentPeriodEnd"
                    type="date"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Atualizar assinatura</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários vinculados</CardTitle>
              <CardDescription>Visão rápida dos acessos deste tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                      {user.role}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-semibold ${
                        user.isBlocked
                          ? "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100"
                          : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100"
                      }`}
                    >
                      {user.isBlocked ? "Bloqueado" : "Ativo"}
                    </span>
                    <span>Criado em {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>Dados operacionais e de assinatura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Criada em:</strong> {formatDate(tenant.createdAt)}
              </p>
              <p>
                <strong className="text-foreground">Início da assinatura:</strong>{" "}
                {tenant.subscriptionStartDate ? formatDate(tenant.subscriptionStartDate) : "Não definido"}
              </p>
              <p>
                <strong className="text-foreground">Vencimento:</strong>{" "}
                {tenant.subscriptionCurrentPeriodEnd
                  ? formatDate(tenant.subscriptionCurrentPeriodEnd)
                  : "Não definido"}
              </p>
              <p>
                <strong className="text-foreground">Dias restantes:</strong>{" "}
                {tenant.subscriptionDaysRemaining ?? "Não definido"}
              </p>
              <p>
                <strong className="text-foreground">Responsável:</strong>{" "}
                {responsibleUser?.name ?? "Não definido"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações administrativas</CardTitle>
              <CardDescription>Bloqueio manual e exclusão do tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.isBlocked ? (
                <form action={unblockSuperAdminBarbershopAction}>
                  <input name="tenantId" type="hidden" value={tenant.id} />
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <Button type="submit">Desbloquear barbearia</Button>
                </form>
              ) : (
                <form action={blockSuperAdminBarbershopAction} className="space-y-3">
                  <input name="tenantId" type="hidden" value={tenant.id} />
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <div className="space-y-2">
                    <Label htmlFor="blockedReason">Motivo do bloqueio</Label>
                    <Textarea
                      defaultValue={tenant.blockedReason ?? ""}
                      id="blockedReason"
                      name="blockedReason"
                      placeholder="Ex.: cobrança em análise ou violação contratual"
                    />
                  </div>
                  <ConfirmButton
                    confirmationMessage={`Bloquear a barbearia ${tenant.name}?`}
                    type="submit"
                    variant="destructive"
                  >
                    Bloquear barbearia
                  </ConfirmButton>
                </form>
              )}

              <form action={deleteSuperAdminBarbershopAction}>
                <input name="tenantId" type="hidden" value={tenant.id} />
                <input name="redirectTo" type="hidden" value={redirectTo} />
                <ConfirmButton
                  confirmationMessage={`Excluir a barbearia ${tenant.name} e todos os dados relacionados?`}
                  type="submit"
                  variant="destructive"
                >
                  Excluir barbearia
                </ConfirmButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico recente</CardTitle>
              <CardDescription>Últimas alterações feitas nesta barbearia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.activityLogs.length ? (
                tenant.activityLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-border p-4 text-sm">
                    <p className="font-semibold">{log.action}</p>
                    <p className="mt-1 text-muted-foreground">{log.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(log.createdAt)} • {log.actorUser?.email ?? "Sistema"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ação administrativa registrada ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
