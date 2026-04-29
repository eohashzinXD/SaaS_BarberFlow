import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { FlashMessage } from "@/components/flash-message";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { deleteServiceAction } from "@/server/actions/services";
import { requireTenantSession } from "@/server/auth/tenant-session";
import { listServicesByTenant } from "@/server/services";

type ServicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const session = await requireTenantSession();
  const services = await listServicesByTenant(session.tenantId);

  return (
    <div className="space-y-6">
      <SectionHeader
        description="Estruture seu catálogo com duração, preço e descrição em uma apresentação consistente."
        eyebrow="Nexora Workspace"
        title="Serviços"
        actions={
          <Button asChild>
            <Link href="/dashboard/services/new">Novo serviço</Link>
          </Button>
        }
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      {services.length ? (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.durationMinutes} min • {formatCurrency(service.price.toString())}
                  </p>
                  {service.description ? (
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  ) : null}
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/services/${service.id}`}>Editar</Link>
                  </Button>
                  <form action={deleteServiceAction}>
                    <input name="serviceId" type="hidden" value={service.id} />
                    <Button variant="destructive">Excluir</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum serviço cadastrado"
          description="Crie o primeiro serviço para estruturar o catálogo visível no booking e na agenda."
          action={
            <Button asChild>
              <Link href="/dashboard/services/new">Cadastrar serviço</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
