import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFlashFromSearchParams } from "@/lib/navigation";
import { loginAction } from "@/server/actions/auth";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const callbackUrl =
    typeof params.callbackUrl === "string" && params.callbackUrl.startsWith("/")
      ? params.callbackUrl
      : "";

  return (
    <AuthShell
      bullets={[
        "Controle agenda, equipe e catálogo em um único workspace.",
        "Acesso com billing e provisionamento alinhados ao fluxo SaaS.",
        "Experiência limpa para operação diária e expansão do negócio."
      ]}
      description="Entre no ambiente Nexora para acompanhar a agenda, manter dados operacionais atualizados e responder com velocidade ao dia a dia do negócio."
      eyebrow="Nexora Access"
      title="Acesse seu workspace com a mesma clareza que sua equipe precisa operar."
    >
      <div className="space-y-6">
        {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
        {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

        <Card>
          <CardHeader>
            <CardTitle>Entrar na Nexora</CardTitle>
            <CardDescription>
              Use o e-mail e a senha da conta administradora para acessar sua operação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-5">
              <input name="callbackUrl" type="hidden" value={callbackUrl} />
              <div className="space-y-2">
                <Label htmlFor="email">E-mail corporativo</Label>
                <Input id="email" name="email" placeholder="voce@empresa.com" required type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" required type="password" />
              </div>
              <SubmitButton className="w-full" pendingLabel="Entrando...">
                Entrar no painel
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não opera com a Nexora?{" "}
          <Link className="font-semibold text-foreground underline underline-offset-4" href="/register">
            Criar conta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
