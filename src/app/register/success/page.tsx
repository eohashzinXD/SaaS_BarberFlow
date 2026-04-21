import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSignupStatusById } from "@/server/billing";
import { registerSuccessQuerySchema } from "@/server/schemas/auth";

type RegisterSuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterSuccessPage({ searchParams }: RegisterSuccessPageProps) {
  const params = await searchParams;
  const parsed = registerSuccessQuerySchema.safeParse({
    signup_id: typeof params.signup_id === "string" ? params.signup_id : undefined
  });

  const signup = parsed.success ? await getSignupStatusById(parsed.data.signup_id) : null;

  const isReady = signup?.status === "PROVISIONED";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isReady ? "Pagamento confirmado" : "Pagamento recebido"}</CardTitle>
            <CardDescription>
              {isReady
                ? "Sua assinatura foi ativada e sua conta já pode acessar o painel."
                : "Estamos finalizando a ativação da sua conta com base na confirmação do webhook do gateway."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {signup ? (
              <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Barbearia:</strong> {signup.barbershopName}
                </p>
                <p>
                  <strong className="text-foreground">E-mail:</strong> {signup.email}
                </p>
                <p>
                  <strong className="text-foreground">Status:</strong> {signup.status}
                </p>
              </div>
            ) : (
              <FlashMessage
                message="Não foi possível localizar este cadastro. Se o pagamento foi concluído, aguarde alguns instantes e tente entrar."
                type="error"
              />
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/login">Ir para login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={parsed.success ? `/register/success?signup_id=${parsed.data.signup_id}` : "/register"}>
                  Atualizar status
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
