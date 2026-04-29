import { addDays } from "date-fns";
import { CalendarCheck2, Clock4, MapPin, Phone } from "lucide-react";
import { notFound } from "next/navigation";

import { BrandLockup } from "@/components/brand";
import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDateInput, getWeekdayLabel } from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { createPublicAppointmentAction } from "@/server/actions/appointments";
import { getAvailableSlotsForBooking } from "@/server/appointments";
import { bookingQuerySchema } from "@/server/schemas/appointments";
import { getPublicBookingContext } from "@/server/public";

export const revalidate = 60;

type PublicBarbershopPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublicBarbershopPage({
  params,
  searchParams
}: PublicBarbershopPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const flash = getFlashFromSearchParams(query);
  const parsedQuery = bookingQuerySchema.safeParse({
    serviceId: typeof query.serviceId === "string" ? query.serviceId : undefined,
    barberId: typeof query.barberId === "string" ? query.barberId : undefined,
    date: typeof query.date === "string" ? query.date : undefined,
    slot: typeof query.slot === "string" ? query.slot : undefined
  });
  const bookingParams = parsedQuery.success ? parsedQuery.data : {};

  const bookingContext = await getPublicBookingContext({
    slug,
    serviceId: bookingParams.serviceId,
    barberId: bookingParams.barberId,
    date: bookingParams.date
  });

  if (!bookingContext) {
    notFound();
  }

  const selectedDate = bookingParams.date ?? formatDateInput(addDays(new Date(), 1));
  const slots =
    bookingContext.selectedService && bookingContext.selectedBarber
      ? await getAvailableSlotsForBooking({
          tenantId: bookingContext.shop.id,
          serviceId: bookingContext.selectedService.id,
          barberId: bookingContext.selectedBarber.id,
          date: selectedDate
        })
      : [];

  const selectedSlot = slots.find((slot) => slot.label === bookingParams.slot && slot.available);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <section className="grid gap-6 rounded-[2rem] border border-border bg-card/[0.95] p-8 shadow-xl shadow-primary/[0.05] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <BrandLockup compact subtitle="Powered by Nexora" />
          <span className="section-kicker">Página pública Nexora</span>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-semibold tracking-tight">{bookingContext.shop.name}</h1>
            <p className="max-w-2xl text-muted-foreground">
              {bookingContext.shop.profile?.description ?? "Agendamentos online disponíveis."}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="surface-muted p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço
              </p>
              <p>{bookingContext.shop.profile?.address ?? "Não informado"}</p>
            </div>
            <div className="surface-muted p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                Telefone
              </p>
              <p>{bookingContext.shop.profile?.phone ?? "Não informado"}</p>
            </div>
          </div>
        </div>

        <Card className="border-secondary bg-secondary/[0.4]">
          <CardHeader>
            <CardTitle>Horários de funcionamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookingContext.shop.businessHours.length ? (
              bookingContext.shop.businessHours.map((hour) => (
                <div key={hour.id} className="flex items-center justify-between text-sm">
                  <span>{getWeekdayLabel(hour.weekday)}</span>
                  <span className="font-semibold">
                    {hour.startTime} - {hour.endTime}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Horários ainda não configurados.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
            <CardDescription>Escolha o atendimento ideal para sua próxima visita.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookingContext.shop.services.map((service) => (
              <div key={service.id} className="rounded-2xl border border-border/[0.8] bg-secondary/[0.25] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm font-semibold">{formatCurrency(service.price.toString())}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {service.durationMinutes} min
                  {service.description ? ` • ${service.description}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barbeiros</CardTitle>
            <CardDescription>Profissionais disponíveis para o seu atendimento.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {bookingContext.shop.barbers.map((barber) => (
              <div key={barber.id} className="rounded-2xl border border-border/[0.8] bg-secondary/[0.25] p-4 text-sm font-semibold">
                {barber.name}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Agendar atendimento</CardTitle>
          <CardDescription>
            Escolha serviço, profissional, data e horário. O status inicial do agendamento é pendente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form className="grid gap-5 md:grid-cols-3" method="get">
            <div className="space-y-2">
              <Label htmlFor="serviceId">Serviço</Label>
              <NativeSelect defaultValue={bookingContext.selectedService?.id ?? ""} id="serviceId" name="serviceId" required>
                <option value="">Selecione</option>
                {bookingContext.shop.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barberId">Profissional</Label>
              <NativeSelect defaultValue={bookingContext.selectedBarber?.id ?? ""} id="barberId" name="barberId" required>
                <option value="">Selecione</option>
                {bookingContext.shop.barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input defaultValue={selectedDate} id="date" min={formatDateInput(new Date())} name="date" type="date" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" variant="outline">
                Ver horários disponíveis
              </Button>
            </div>
          </form>

          {bookingContext.selectedService && bookingContext.selectedBarber ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Horários disponíveis
                </p>
                <p className="text-sm text-muted-foreground">
                  Os horários em cinza já estão ocupados ou fora da janela válida.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {slots.length ? (
                  slots.map((slot) => (
                    <a
                      key={slot.label}
                      className={`rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${
                        slot.available
                          ? slot.label === selectedSlot?.label
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-secondary"
                          : "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60"
                      }`}
                      href={
                        slot.available
                          ? `/barbearia/${slug}?serviceId=${bookingContext.selectedService?.id}&barberId=${bookingContext.selectedBarber?.id}&date=${selectedDate}&slot=${slot.label}`
                          : undefined
                      }
                    >
                      {slot.label}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum slot disponível para os critérios selecionados.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {bookingContext.selectedService && bookingContext.selectedBarber && selectedSlot ? (
            <Card className="bg-secondary/[0.3]">
              <CardHeader>
                <CardTitle>Confirmar agendamento</CardTitle>
                <CardDescription>
                  Revise o resumo e informe os dados do cliente para concluir a reserva.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid gap-3 rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Serviço:</strong> {bookingContext.selectedService.name}
                  </p>
                  <p>
                    <strong className="text-foreground">Profissional:</strong> {bookingContext.selectedBarber.name}
                  </p>
                  <p>
                    <strong className="text-foreground">Data:</strong> {selectedDate} às {selectedSlot.label}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4 text-primary" />
                    <Clock4 className="h-4 w-4 text-primary" />
                    Reserva operada pela Nexora
                  </p>
                </div>
                <form action={createPublicAppointmentAction} className="grid gap-5 md:grid-cols-2">
                  <input name="slug" type="hidden" value={slug} />
                  <input name="serviceId" type="hidden" value={bookingContext.selectedService.id} />
                  <input name="barberId" type="hidden" value={bookingContext.selectedBarber.id} />
                  <input name="date" type="hidden" value={selectedDate} />
                  <input name="slot" type="hidden" value={selectedSlot.label} />
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nome do cliente</Label>
                    <Input id="customerName" name="customerName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">E-mail</Label>
                    <Input id="customerEmail" name="customerEmail" required type="email" />
                  </div>
                  <div className="md:col-span-2">
                    <SubmitButton pendingLabel="Confirmando agendamento...">
                      Confirmar agendamento
                    </SubmitButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
