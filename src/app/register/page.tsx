import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { registerAction } from "@/server/actions/auth";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <div className="w-full space-y-6">
        {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}
        <Card>
          <CardHeader>
            <CardTitle>Criar nova barbearia</CardTitle>
            <CardDescription>
              O cadastro inicia o checkout da assinatura. A conta só é ativada depois da confirmação do pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={registerAction} className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Seu nome</Label>
                <Input id="ownerName" name="ownerName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" required type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barbershopName">Nome da barbearia</Label>
                <Input id="barbershopName" name="barbershopName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug público</Label>
                <Input id="slug" name="slug" placeholder="minha-barbearia" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" required type="password" />
              </div>
              <div className="md:col-span-2">
                <SubmitButton className="w-full" pendingLabel="Redirecionando para pagamento...">
                  Criar conta e ir para pagamento
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Já tem acesso?{" "}
          <Link className="font-semibold text-foreground underline" href="/login">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
