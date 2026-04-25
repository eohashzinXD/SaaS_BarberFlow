import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
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
        title="Super Admin"
        description="Visão global da operação SaaS, com status de tenants, usuários e cobrança."
        actions={
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/super-admin/barbershops">Gerenciar barbearias</Link>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Barbearias cadastradas</CardTitle>
            <CardDescription>Total de tenants provisionados.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.totalTenants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Usuários da plataforma</CardTitle>
            <CardDescription>Exceto contas internas de Super Admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Barbearias ativas</CardTitle>
            <CardDescription>Tenants liberados para uso.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.activeTenants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agendamentos totais</CardTitle>
            <CardDescription>Volume acumulado na plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.totalAppointments}</p>
          </CardContent>
        </Card>
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
          <CardTitle>Barbearias recentes</CardTitle>
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
