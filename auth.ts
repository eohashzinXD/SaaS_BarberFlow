import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth-config";
import { authenticateCredentials } from "@/server/auth/authenticate";
import { loginSchema } from "@/server/schemas/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const result = await authenticateCredentials(parsed.data);

        if (result.status !== "success") {
          return null;
        }

        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          emailVerified: null,
          role: result.user.role,
          tenantId: result.user.tenantId,
          billingStatus: result.user.tenant.billingStatus
        };
      }
    })
  ]
});
