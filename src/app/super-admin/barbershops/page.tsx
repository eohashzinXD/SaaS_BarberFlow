import Link from "next/link";

import { ConfirmButton } from "@/components/confirm-button";
import { FlashMessage } from "@/components/flash-message";
import { SectionHeader } from "@/components/section-header";
import { PlatformStatusBadge } from "@/components/super-admin/platform-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import {
  blockSuperAdminBarbershopAction,
  createSuperAdminBarbershopAction,
  deleteSuperAdminBarbershopAction,
  unblockSuperAdminBarbershopAction
} from "@/server/actions/super-admin";
import { listSuperAdminBarbershops } from "@/server/super-admin";

const statusOptions = [
  { value: "ALL", label: "Todos os status" },
  { value: "ACTIVE", label: "Ativas" },
  { value: "EXPIRING", label: "Vencendo em breve" },
  { value: "EXPIRED", label: "Vencidas" },
  { value: "BLOCKED", label: "Bloqueadas" },
  { value: "PENDING_PAYMENT", label: "Pendentes" },
  { value: "CANCELED", label: "Canceladas" }
] as const;

type SuperAdminBarbershopsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SuperAdminBarbershopsPage({
  searchParams
}: SuperAdminBarbershopsPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const { filters, barbershops } = await listSuperAdminBarbershops(params);
  const currentPath = `/super-admin/barbershops${filters.query || filters.status !== "ALL" ? `?${new URLSearchParams({
    ...(filters.query ? { query: filters.query } : {}),
    ...(filters.status !== "ALL" ? { status: filters.status } : {})
  }).toString()}` : ""}`;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Barbearias"
        description="Busca global de tenants, status de assinatura e ações críticas."
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Pesquise por nome, slug, responsável, e-mail ou telefone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <div className="space-y-2">
              <Label htmlFor="query">Busca</Label>
              <Input defaultValue={filters.query ?? ""} id="query" name="query" placeholder="Nome, slug ou e-mail" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={filters.status}
                id="status"
                name="status"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <Button type="submit">Aplicar</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/super-admin/barbershops">Limpar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar barbearia</CardTitle>
          <CardDescription>
            Crie uma barbearia manualmente com acesso ativo até o fim do período de teste.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSuperAdminBarbershopAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input name="redirectTo" type="hidden" value={currentPath} />
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome da barbearia</Label>
              <Input id="create-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input id="create-slug" name="slug" placeholder="minha-barbearia" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-trialDays">Período de teste (dias)</Label>
              <Input defaultValue={7} id="create-trialDays" min={1} name="trialDays" required type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Telefone</Label>
              <Input id="create-phone" name="phone" />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="create-address">Endereço</Label>
              <Input id="create-address" name="address" />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="create-description">Descrição</Label>
              <Textarea id="create-description" name="description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-ownerName">Responsável inicial</Label>
              <Input id="create-ownerName" name="ownerName" placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-ownerEmail">E-mail do responsável</Label>
              <Input id="create-ownerEmail" name="ownerEmail" placeholder="Opcional" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-ownerPassword">Senha do responsável</Label>
              <Input
                autoComplete="new-password"
                id="create-ownerPassword"
                minLength={8}
                name="ownerPassword"
                placeholder="Opcional"
                type="password"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">Cadastrar barbearia</Button>
            </div>
            <p className="text-xs text-muted-foreground md:col-span-2 xl:col-span-4">
              Se preencher um responsável inicial, informe nome, e-mail e senha. Ele será criado como ADMIN.
            </p>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Encontradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{barbershops.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bloqueadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {barbershops.filter((item) => item.platformStatus === "BLOCKED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vencimento crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {
                barbershops.filter((item) =>
                  ["EXPIRING", "EXPIRED"].includes(item.platformStatus)
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="space-y-4">
        {barbershops.map((tenant) => (
          <Card key={tenant.id}>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{tenant.name}</h2>
                    <PlatformStatusBadge status={tenant.platformStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                  <p className="text-sm text-muted-foreground">
                    Responsável: {tenant.responsibleUser?.name ?? "Não definido"} •{" "}
                    {tenant.responsibleUser?.email ?? "Sem e-mail"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Telefone: {tenant.profile?.phone ?? "Não informado"} • Criada em{" "}
                    {formatDate(tenant.createdAt)}
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:min-w-[360px]">
                  <div className="rounded-2xl border border-border p-4">
                    <p className="font-semibold text-foreground">Assinatura</p>
                    <p>{tenant.subscriptionCurrentPeriodEnd ? formatDate(tenant.subscriptionCurrentPeriodEnd) : "Sem vencimento"}</p>
                    <p>
                      {tenant.subscriptionDaysRemaining === null
                        ? "Sem prazo definido"
                        : `${tenant.subscriptionDaysRemaining} dia(s) restantes`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="font-semibold text-foreground">Operação</p>
                    <p>{tenant._count.users} usuários</p>
                    <p>
                      {tenant._count.barbers} barbeiros • {tenant._count.services} serviços
                    </p>
                    <p>{tenant._count.appointments} agendamentos</p>
                  </div>
                </div>
              </div>

              {tenant.blockedReason ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  <strong>Motivo do bloqueio:</strong> {tenant.blockedReason}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/super-admin/barbershops/${tenant.id}`}>Ver detalhes</Link>
                </Button>

                {tenant.isBlocked ? (
                  <form action={unblockSuperAdminBarbershopAction}>
                    <input name="tenantId" type="hidden" value={tenant.id} />
                    <input name="redirectTo" type="hidden" value={currentPath} />
                    <Button size="sm" type="submit">
                      Desbloquear
                    </Button>
                  </form>
                ) : (
                  <form action={blockSuperAdminBarbershopAction} className="flex flex-wrap gap-3">
                    <input name="tenantId" type="hidden" value={tenant.id} />
                    <input name="redirectTo" type="hidden" value={currentPath} />
                    <Textarea
                      className="min-h-11 w-full md:w-80"
                      name="blockedReason"
                      placeholder="Motivo do bloqueio (opcional)"
                    />
                    <ConfirmButton
                      confirmationMessage={`Bloquear a barbearia ${tenant.name}?`}
                      size="sm"
                      type="submit"
                      variant="destructive"
                    >
                      Bloquear
                    </ConfirmButton>
                  </form>
                )}

                <form action={deleteSuperAdminBarbershopAction}>
                  <input name="tenantId" type="hidden" value={tenant.id} />
                  <input name="redirectTo" type="hidden" value={currentPath} />
                  <ConfirmButton
                    confirmationMessage={`Excluir a barbearia ${tenant.name} e todos os dados vinculados?`}
                    size="sm"
                    type="submit"
                    variant="destructive"
                  >
                    Excluir
                  </ConfirmButton>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}

        {!barbershops.length ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhuma barbearia encontrada para os filtros informados.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
