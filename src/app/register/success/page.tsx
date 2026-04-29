import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
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
    <AuthShell
      bullets={[
        "O provisionamento depende da confirmação segura do webhook.",
        "Sua operação é criada apenas após a validação do pagamento.",
        "O painel Nexora fica disponível assim que o status muda para provisionado."
      ]}
      description="A Nexora mantém o onboarding sincronizado com o gateway para garantir ativação segura e previsível."
      eyebrow="Nexora Billing"
      title={isReady ? "Sua assinatura foi ativada com sucesso." : "Pagamento recebido. Finalizando ativação."}
    >
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isReady ? "Conta pronta para acesso" : "Confirmação em processamento"}</CardTitle>
            <CardDescription>
              {isReady
                ? "Sua assinatura foi ativada e o workspace Nexora já está disponível."
                : "Estamos concluindo a ativação com base na confirmação do webhook do gateway."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {signup ? (
              <div className="surface-muted grid gap-2 p-4 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Operação:</strong> {signup.barbershopName}
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
    </AuthShell>
  );
}
