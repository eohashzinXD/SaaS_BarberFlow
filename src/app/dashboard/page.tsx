import { FlashMessage } from "@/components/flash-message";
import { EmptyState } from "@/components/empty-state";
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
        title="Dashboard"
        description="Resumo operacional da agenda de hoje da sua barbearia."
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agendamentos hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.todayAppointments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{snapshot.confirmedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Catálogo ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {snapshot.barbersCount} / {snapshot.servicesCount}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Agenda do dia</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.todayAppointments.length ? (
            <div className="space-y-4">
              {snapshot.todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{appointment.customerName}</p>
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
              description="Quando surgirem reservas, elas aparecerão aqui com o status atualizado."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
