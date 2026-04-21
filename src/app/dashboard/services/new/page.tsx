import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { createServiceAction } from "@/server/actions/services";

type NewServicePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewServicePage({ searchParams }: NewServicePageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Novo serviço"
        description="Configure um serviço com duração e preço para a agenda."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/services">Voltar</Link>
          </Button>
        }
      />
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}
      <Card>
        <CardContent className="p-6">
          <form action={createServiceAction} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duração (minutos)</Label>
              <Input id="durationMinutes" min={10} name="durationMinutes" required type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input id="price" name="price" placeholder="59.90" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="Salvando...">Salvar serviço</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
