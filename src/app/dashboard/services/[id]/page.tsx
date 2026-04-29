import Link from "next/link";
import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { updateServiceAction } from "@/server/actions/services";
import { requireTenantSession } from "@/server/auth/tenant-session";
import { getServiceByTenant } from "@/server/services";

type EditServicePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditServicePage({ params, searchParams }: EditServicePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const flash = getFlashFromSearchParams(query);
  const session = await requireTenantSession();
  const service = await getServiceByTenant({
    serviceId: id,
    tenantId: session.tenantId
  });

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        description="Atualize as informações que organizam o booking, o catálogo e a agenda."
        eyebrow="Nexora Workspace"
        title="Editar serviço"
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/services">Voltar</Link>
          </Button>
        }
      />
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}
      <Card>
        <CardContent className="p-6">
          <form action={updateServiceAction} className="grid-form">
            <input name="serviceId" type="hidden" value={service.id} />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input defaultValue={service.name} id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duração (minutos)</Label>
              <Input
                defaultValue={service.durationMinutes}
                id="durationMinutes"
                min={10}
                name="durationMinutes"
                required
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input defaultValue={service.price.toString()} id="price" name="price" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                defaultValue={service.description ?? ""}
                id="description"
                name="description"
                placeholder="Descreva a proposta, o benefício e o posicionamento deste serviço."
              />
            </div>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="Salvando...">Atualizar serviço</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
