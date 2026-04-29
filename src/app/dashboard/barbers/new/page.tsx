import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { createBarberAction } from "@/server/actions/barbers";

type NewBarberPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewBarberPage({ searchParams }: NewBarberPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);

  return (
    <div className="space-y-6">
      <SectionHeader
        description="Adicione um novo profissional ao catálogo interno e à experiência pública."
        eyebrow="Nexora Workspace"
        title="Novo profissional"
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/barbers">Voltar</Link>
          </Button>
        }
      />
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}
      <Card>
        <CardContent className="p-6">
          <form action={createBarberAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Nome do profissional" required />
            </div>
            <SubmitButton pendingLabel="Salvando...">Salvar profissional</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
