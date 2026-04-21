-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "PendingSignupStatus" AS ENUM ('PENDING_PAYMENT', 'CHECKOUT_OPEN', 'PAID', 'PROVISIONED', 'EXPIRED', 'CANCELED');

-- AlterTable
ALTER TABLE "Tenant"
ADD COLUMN "billingCustomerId" TEXT,
ADD COLUMN "billingStatus" "BillingStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "billingSubscriptionId" TEXT,
ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMP(3);

-- Existing tenants predate billing enforcement. Keep them active after the migration.
ALTER TABLE "Tenant"
ALTER COLUMN "billingStatus" SET DEFAULT 'PENDING_PAYMENT';

-- CreateTable
CREATE TABLE "PendingSignup" (
    "id" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "barbershopName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PendingSignupStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "billingCheckoutId" TEXT,
    "billingCustomerId" TEXT,
    "billingSubscriptionId" TEXT,
    "tenantId" TEXT,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_billingCustomerId_key" ON "Tenant"("billingCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_billingSubscriptionId_key" ON "Tenant"("billingSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_billingCheckoutId_key" ON "PendingSignup"("billingCheckoutId");

-- CreateIndex
CREATE INDEX "PendingSignup_email_status_idx" ON "PendingSignup"("email", "status");

-- CreateIndex
CREATE INDEX "PendingSignup_slug_status_idx" ON "PendingSignup"("slug", "status");

-- CreateIndex
CREATE INDEX "PendingSignup_tenantId_idx" ON "PendingSignup"("tenantId");

-- AddForeignKey
ALTER TABLE "PendingSignup" ADD CONSTRAINT "PendingSignup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
