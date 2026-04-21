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
      tenantId: string;
      role: Role;
      billingStatus: BillingStatus;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: Date | null;
    tenantId: string;
    role: Role;
    billingStatus: BillingStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    tenantId: string;
    role: Role;
    name: string;
    billingStatus: BillingStatus;
  }
}
