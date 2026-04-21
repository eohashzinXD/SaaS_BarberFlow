"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { buildRedirectUrl } from "@/lib/navigation";
import { authenticateCredentials, getInactiveBillingMessage } from "@/server/auth/authenticate";
import { createPendingSignupCheckout, ensureSignupEligibility } from "@/server/billing";
import { loginSchema, registerSchema } from "@/server/schemas/auth";
import { signIn, signOut } from "../../../auth";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password")
  });

  const callbackUrl = getString(formData, "callbackUrl") || "/dashboard";

  if (!parsed.success) {
    redirect(
      buildRedirectUrl("/login", {
        error: parsed.error.issues[0]?.message ?? "Não foi possível entrar.",
        callbackUrl
      })
    );
  }

  const authAttempt = await authenticateCredentials(parsed.data);

  if (authAttempt.status === "inactive") {
    redirect(
      buildRedirectUrl("/login", {
        error: getInactiveBillingMessage(
          authAttempt.billingStatus,
          authAttempt.subscriptionCurrentPeriodEnd
        ),
        callbackUrl
      })
    );
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(
        buildRedirectUrl("/login", {
          error: "E-mail ou senha inválidos.",
          callbackUrl
        })
      );
    }

    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    ownerName: getString(formData, "ownerName"),
    email: getString(formData, "email").toLowerCase(),
    password: getString(formData, "password"),
    barbershopName: getString(formData, "barbershopName"),
    slug: getString(formData, "slug").toLowerCase()
  });

  if (!parsed.success) {
    redirect(
      buildRedirectUrl("/register", {
        error: parsed.error.issues[0]?.message ?? "Não foi possível concluir o cadastro."
      })
    );
  }

  try {
    await ensureSignupEligibility({
      email: parsed.data.email,
      slug: parsed.data.slug
    });
  } catch (error) {
    redirect(
      buildRedirectUrl("/register", {
        error: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento."
      })
    );
  }

  try {
    const session = await createPendingSignupCheckout(parsed.data);
    redirect(session.url ?? "/register");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    redirect(
      buildRedirectUrl("/register", {
        error:
          error instanceof Error
            ? "Não foi possível iniciar o checkout: " + error.message
            : "Não foi possível iniciar o checkout."
      })
    );
  }
}

export async function logoutAction() {
  await signOut({
    redirectTo: "/"
  });
}
