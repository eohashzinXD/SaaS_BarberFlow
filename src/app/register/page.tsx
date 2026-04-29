import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
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
    <AuthShell
      bullets={[
        "Provisionamento após confirmação de pagamento via checkout.",
        "Página pública, equipe e catálogo em um fluxo de ativação único.",
        "Arquitetura multi-tenant preparada para escalar com consistência."
      ]}
      description="Crie sua operação na Nexora com uma experiência de onboarding objetiva, consistente e pronta para produção."
      eyebrow="Nexora Onboarding"
      title="Ative sua operação com uma identidade SaaS clara desde o primeiro acesso."
    >
      <div className="space-y-6">
        {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}
        <Card>
          <CardHeader>
            <CardTitle>Criar conta na Nexora</CardTitle>
            <CardDescription>
              O cadastro inicia o checkout da assinatura. O acesso é liberado após a confirmação do pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={registerAction} className="grid-form">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Responsável</Label>
                <Input id="ownerName" name="ownerName" placeholder="Seu nome" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" placeholder="voce@empresa.com" required type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barbershopName">Nome da operação</Label>
                <Input id="barbershopName" name="barbershopName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Identificador público</Label>
                <Input id="slug" name="slug" placeholder="sua-marca" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" required type="password" />
              </div>
              <div className="md:col-span-2">
                <SubmitButton className="w-full" pendingLabel="Redirecionando para pagamento...">
                  Criar conta e seguir para pagamento
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Já possui acesso?{" "}
          <Link className="font-semibold text-foreground underline underline-offset-4" href="/login">
            Entrar no painel
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
