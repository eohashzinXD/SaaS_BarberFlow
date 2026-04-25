import { BillingStatus, Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: Date | null;
      tenantId: string | null;
      role: Role;
      billingStatus: BillingStatus | null;
      isBlocked: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: Date | null;
    tenantId: string | null;
    role: Role;
    billingStatus: BillingStatus | null;
    isBlocked: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    tenantId: string | null;
    role: Role;
    name: string;
    billingStatus: BillingStatus | null;
    isBlocked: boolean;
  }
}
