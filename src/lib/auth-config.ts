import type { BillingStatus, Role } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? "";
        token.email = user.email ?? "";
        token.tenantId = user.tenantId ?? null;
        token.role = user.role;
        token.billingStatus = user.billingStatus ?? null;
        token.isBlocked = user.isBlocked;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        emailVerified: null,
        tenantId: token.tenantId,
        role: token.role as Role,
        billingStatus: (token.billingStatus as BillingStatus | null) ?? null,
        isBlocked: Boolean(token.isBlocked)
      };

      return session;
    }
  }
} satisfies NextAuthConfig;
