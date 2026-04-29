import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { PlatformStatusBadge } from "@/components/super-admin/platform-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { getSuperAdminDashboardSnapshot } from "@/server/super-admin";

type SuperAdminDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SuperAdminDashboardPage({
  searchParams
}: SuperAdminDashboardPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const snapshot = await getSuperAdminDashboardSnapshot();

  return (
    <div className="space-y-8">
      <SectionHeader
        description="Visão global da operação, com status de tenants, usuários e cobrança."
        eyebrow="Nexora Platform"
        title="Command center"
        actions={
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/super-admin/barbershops">Gerenciar operações</Link>
            </Button>
            <Button asChild>
              <Link href="/super-admin/users">Gerenciar usuários</Link>
            </Button>
          </div>
        }
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard hint="Tenants provisionados" label="Operações cadastradas" value={snapshot.totalTenants} />
        <MetricCard accent="emerald" hint="Sem contas internas de Super Admin" label="Usuários da plataforma" value={snapshot.totalUsers} />
        <MetricCard accent="primary" hint="Tenants liberados para uso" label="Operações ativas" value={snapshot.activeTenants} />
        <MetricCard accent="amber" hint="Volume acumulado do produto" label="Agendamentos totais" value={snapshot.totalAppointments} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bloqueadas</CardTitle>
            <CardDescription>Bloqueio manual do tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.blockedTenants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mensalidade vencida</CardTitle>
            <CardDescription>Assinatura expirada ou inadimplente.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.expiredTenants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vencendo em breve</CardTitle>
            <CardDescription>
              {snapshot.recentTenantsCount} novos tenants nos últimos 30 dias. Saldo:{" "}
              {snapshot.growthDelta >= 0 ? "+" : ""}
              {snapshot.growthDelta}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.expiringTenants}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Operações recentes</CardTitle>
          <CardDescription>Atalho rápido para revisar novos tenants e pendências.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {snapshot.recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex flex-col gap-4 rounded-2xl border border-border p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold">{tenant.name}</p>
                    <PlatformStatusBadge status={tenant.platformStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    /{tenant.slug} • {tenant.responsibleUser?.email ?? "Sem responsável definido"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Criada em {formatDate(tenant.createdAt)} • {tenant._count.users} usuários •{" "}
                    {tenant._count.appointments} agendamentos
                  </p>
                </div>
                <div className="flex flex-col gap-2 lg:items-end">
                  <p className="text-sm text-muted-foreground">
                    {tenant.subscriptionDaysRemaining === null
                      ? "Sem vencimento definido"
                      : `${tenant.subscriptionDaysRemaining} dia(s) restantes`}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/super-admin/barbershops/${tenant.id}`}>Ver detalhes</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
