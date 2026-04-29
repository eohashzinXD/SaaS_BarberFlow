import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { FlashMessage } from "@/components/flash-message";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { deleteBarberAction } from "@/server/actions/barbers";
import { requireTenantSession } from "@/server/auth/tenant-session";
import { listBarbersByTenant } from "@/server/barbers";

type BarbersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BarbersPage({ searchParams }: BarbersPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const session = await requireTenantSession();
  const barbers = await listBarbersByTenant(session.tenantId);

  return (
    <div className="space-y-6">
      <SectionHeader
        description="Gerencie o time disponível para atendimento com uma visão clara da operação."
        eyebrow="Nexora Workspace"
        title="Equipe"
        actions={
          <Button asChild>
            <Link href="/dashboard/barbers/new">Novo profissional</Link>
          </Button>
        }
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      {barbers.length ? (
        <div className="grid gap-4">
          {barbers.map((barber) => (
            <Card key={barber.id}>
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold">{barber.name}</p>
                  <p className="text-sm text-muted-foreground">Profissional disponível no catálogo e no fluxo de agendamento.</p>
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/barbers/${barber.id}`}>Editar</Link>
                  </Button>
                  <form action={deleteBarberAction}>
                    <input name="barberId" type="hidden" value={barber.id} />
                    <Button variant="destructive">Excluir</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum profissional cadastrado"
          description="Cadastre o primeiro integrante do time para liberar disponibilidade na agenda."
          action={
            <Button asChild>
              <Link href="/dashboard/barbers/new">Cadastrar profissional</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
