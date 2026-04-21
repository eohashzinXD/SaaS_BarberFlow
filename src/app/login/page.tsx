import Link from "next/link";

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
      : "/dashboard";

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <div className="w-full space-y-6">
        {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
        {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

        <Card>
          <CardHeader>
            <CardTitle>Entrar no painel</CardTitle>
            <CardDescription>
              Use o e-mail e a senha do administrador para acessar sua barbearia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-5">
              <input name="callbackUrl" type="hidden" value={callbackUrl} />
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" required type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" required type="password" />
              </div>
              <SubmitButton className="w-full" pendingLabel="Entrando...">
                Entrar
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link className="font-semibold text-foreground underline" href="/register">
            Criar barbearia
          </Link>
        </p>
      </div>
    </main>
  );
}
