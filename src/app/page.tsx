import { AppointmentStatus, BillingStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { ArrowRight, CalendarRange, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { MetricCard } from "@/components/metric-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getLandingMetrics() {
  const today = new Date();
  const activeTenantWhere = {
    billingStatus: BillingStatus.ACTIVE,
    isBlocked: false
  };

  const [appointmentsToday, activeBarbers, publishedServices] = await Promise.all([
    prisma.appointment.count({
      where: {
        startAt: {
          gte: startOfDay(today),
          lte: endOfDay(today)
        },
        status: {
          not: AppointmentStatus.CANCELED
        },
        tenant: activeTenantWhere
      }
    }),
    prisma.barber.count({
      where: {
        tenant: activeTenantWhere
      }
    }),
    prisma.service.count({
      where: {
        tenant: activeTenantWhere
      }
    })
  ]);

  return {
    appointmentsToday,
    activeBarbers,
    publishedServices
  };
}

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

export default async function HomePage() {
  const metrics = await getLandingMetrics();

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-12 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <BrandLockup subtitle="Agendamento e gestão profissional" />
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          href="/login"
        >
          Acessar painel
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <span className="section-kicker">Nexora Workspace</span>
          <div className="space-y-5">
            <h1 className="max-w-4xl font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Operação, agenda e gestão com identidade profissional e presença de marca consistente.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              A Nexora centraliza agendamentos, equipe, serviços e visibilidade pública em uma experiência
              limpa, confiável e pronta para crescer com sua operação.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--accent))_100%)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5"
              href="/register"
            >
              Iniciar com a Nexora
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-card/[0.92] px-6 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-secondary/[0.7]"
              href="/login"
            >
              Entrar no painel
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-muted flex items-start gap-3 px-4 py-4 text-sm text-muted-foreground">
              <CalendarRange className="mt-0.5 h-4 w-4 text-primary" />
              Agenda e remarcação com visão operacional do dia.
            </div>
            <div className="surface-muted flex items-start gap-3 px-4 py-4 text-sm text-muted-foreground">
              <ChartNoAxesCombined className="mt-0.5 h-4 w-4 text-primary" />
              Catálogo, equipe e métricas com leitura clara.
            </div>
            <div className="surface-muted flex items-start gap-3 px-4 py-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              Controle de acesso e cobrança com operação previsível.
            </div>
          </div>
        </div>

        <div className="surface-panel p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="section-kicker">Snapshot da plataforma</span>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Uma vitrine profissional para sua operação.
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Página pública, painel interno e estrutura multi-tenant alinhados na mesma identidade.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                accent="primary"
                hint={pluralize(metrics.appointmentsToday, "agendamento confirmado para hoje", "agendamentos mapeados para hoje")}
                label="Hoje"
                value={metrics.appointmentsToday}
              />
              <MetricCard
                accent="emerald"
                hint={`${metrics.activeBarbers} profissionais ativos`}
                label="Equipe disponível"
                value={metrics.activeBarbers}
              />
              <MetricCard
                accent="amber"
                hint={`${metrics.publishedServices} serviços publicados`}
                label="Catálogo"
                value={metrics.publishedServices}
                className="sm:col-span-2"
              />
            </div>
            <div className="surface-muted p-5">
              <p className="text-sm leading-7 text-muted-foreground">
                Cada cliente Nexora recebe uma presença digital pronta para captar novos agendamentos sem sacrificar clareza operacional no painel administrativo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
