import { CalendarClock, CircleCheckBig, Clock3, Sparkles } from "lucide-react";

import { FlashMessage } from "@/components/flash-message";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, getAppointmentStatusLabel } from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { requireTenantSession } from "@/server/auth/tenant-session";
import { getDashboardSnapshot } from "@/server/dashboard";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const session = await requireTenantSession();
  const snapshot = await getDashboardSnapshot(session.tenantId);

  return (
    <div className="space-y-8">
      <SectionHeader
        description="Leitura rápida da agenda, da demanda e do catálogo ativo da sua operação."
        eyebrow="Nexora Workspace"
        title="Visão geral"
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent="primary"
          hint="Reservas previstas para hoje"
          label="Agendamentos hoje"
          value={snapshot.todayAppointments.length}
        />
        <MetricCard accent="amber" hint="Aguardando ação do time" label="Pendentes" value={snapshot.pendingCount} />
        <MetricCard
          accent="emerald"
          hint="Prontos para atendimento"
          label="Confirmados"
          value={snapshot.confirmedCount}
        />
        <MetricCard
          accent="primary"
          hint={`${snapshot.barbersCount} profissionais e ${snapshot.servicesCount} serviços`}
          label="Catálogo ativo"
          value={`${snapshot.barbersCount} / ${snapshot.servicesCount}`}
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/[0.7]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Agenda do dia</CardTitle>
              <p className="text-sm text-muted-foreground">
                Priorize confirmações, acompanhe o fluxo e reaja rápido ao que mudar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              <span className="surface-muted inline-flex items-center gap-2 px-3 py-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Operação diária
              </span>
              <span className="surface-muted inline-flex items-center gap-2 px-3 py-2">
                <Clock3 className="h-4 w-4 text-amber-500" />
                {snapshot.pendingCount} pendentes
              </span>
              <span className="surface-muted inline-flex items-center gap-2 px-3 py-2">
                <CircleCheckBig className="h-4 w-4 text-emerald-500" />
                {snapshot.confirmedCount} confirmados
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {snapshot.todayAppointments.length ? (
            <div className="space-y-4">
              {snapshot.todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-4 rounded-[1.35rem] border border-border/[0.8] bg-secondary/[0.3] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{appointment.customerName}</p>
                      <span className="rounded-full bg-primary/[0.1] px-2.5 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="mr-1 inline h-3 w-3" />
                        Atendimento
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {appointment.service.name} com {appointment.barber.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(appointment.startAt)}</p>
                  </div>
                  <StatusBadge
                    label={getAppointmentStatusLabel(appointment.status)}
                    status={appointment.status}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum agendamento hoje"
              description="Assim que novas reservas entrarem no sistema, a Nexora mostrará tudo aqui com status atualizado."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
