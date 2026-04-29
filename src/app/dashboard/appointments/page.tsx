import Link from "next/link";
import { addDays, subDays } from "date-fns";

import { FlashMessage } from "@/components/flash-message";
import { SectionHeader } from "@/components/section-header";
import { SubmitButton } from "@/components/submit-button";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDateInput,
  formatDateTime,
  getAppointmentStatusLabel
} from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import {
  rescheduleAppointmentAction,
  updateAppointmentStatusAction
} from "@/server/actions/appointments";
import { requireTenantSession } from "@/server/auth/tenant-session";
import { listAppointmentsByTenant } from "@/server/appointments";

type AppointmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const currentDate =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : formatDateInput(new Date());
  const date = new Date(`${currentDate}T00:00:00`);

  const session = await requireTenantSession();
  const appointments = await listAppointmentsByTenant({
    tenantId: session.tenantId,
    date
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        description="Acompanhe os agendamentos do dia, ajuste status e mantenha a operação em ritmo previsível."
        eyebrow="Nexora Workspace"
        title="Agenda"
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <form className="space-y-2" method="get">
            <Label htmlFor="date">Filtrar por dia</Label>
            <div className="flex gap-3">
              <Input defaultValue={currentDate} id="date" name="date" type="date" />
              <Button type="submit" variant="outline">
                Filtrar
              </Button>
            </div>
          </form>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href={`/dashboard/appointments?date=${formatDateInput(subDays(date, 1))}`}>Dia anterior</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/appointments?date=${formatDateInput(addDays(date, 1))}`}>Próximo dia</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {appointments.length ? (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">{appointment.customerName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{appointment.customerEmail}</p>
                </div>
                <StatusBadge
                  label={getAppointmentStatusLabel(appointment.status)}
                  status={appointment.status}
                />
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <p>{appointment.service.name}</p>
                  <p>{appointment.barber.name}</p>
                  <p>{formatDateTime(appointment.startAt)}</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <form action={updateAppointmentStatusAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <input name="appointmentId" type="hidden" value={appointment.id} />
                    <input name="date" type="hidden" value={currentDate} />
                    <div className="space-y-2">
                      <Label htmlFor={`status-${appointment.id}`}>Atualizar status</Label>
                      <NativeSelect defaultValue={appointment.status} id={`status-${appointment.id}`} name="status">
                        <option value="PENDING">Pendente</option>
                        <option value="CONFIRMED">Confirmado</option>
                        <option value="CANCELED">Cancelado</option>
                        <option value="DONE">Concluído</option>
                      </NativeSelect>
                    </div>
                    <SubmitButton pendingLabel="Atualizando..." variant="outline">
                      Atualizar
                    </SubmitButton>
                  </form>

                  <form action={rescheduleAppointmentAction} className="grid gap-3 sm:grid-cols-3 sm:items-end">
                    <input name="appointmentId" type="hidden" value={appointment.id} />
                    <input name="currentDate" type="hidden" value={currentDate} />
                    <div className="space-y-2">
                      <Label htmlFor={`date-${appointment.id}`}>Nova data</Label>
                      <Input
                        defaultValue={formatDateInput(appointment.startAt)}
                        id={`date-${appointment.id}`}
                        name="date"
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`slot-${appointment.id}`}>Novo horário</Label>
                      <Input
                        defaultValue={appointment.startAt.toTimeString().slice(0, 5)}
                        id={`slot-${appointment.id}`}
                        name="slot"
                        type="time"
                      />
                    </div>
                    <SubmitButton pendingLabel="Remarcando..." variant="secondary">
                      Remarcar
                    </SubmitButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum agendamento encontrado para esta data.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
