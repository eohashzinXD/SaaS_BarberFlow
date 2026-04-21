import Link from "next/link";
import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { updateBarberAction } from "@/server/actions/barbers";
import { requireTenantSession } from "@/server/auth/tenant-session";
import { getBarberByTenant } from "@/server/barbers";

type EditBarberPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditBarberPage({ params, searchParams }: EditBarberPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const flash = getFlashFromSearchParams(query);
  const session = await requireTenantSession();
  const barber = await getBarberByTenant({
    barberId: id,
    tenantId: session.tenantId
  });

  if (!barber) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Editar barbeiro"
        description="Atualize os dados exibidos no painel e na página pública."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/barbers">Voltar</Link>
          </Button>
        }
      />
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}
      <Card>
        <CardContent className="p-6">
          <form action={updateBarberAction} className="space-y-5">
            <input name="barberId" type="hidden" value={barber.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input defaultValue={barber.name} id="name" name="name" required />
            </div>
            <SubmitButton pendingLabel="Salvando...">Atualizar barbeiro</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
