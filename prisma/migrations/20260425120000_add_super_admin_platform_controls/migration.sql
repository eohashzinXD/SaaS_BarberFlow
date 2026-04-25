-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Tenant"
ADD COLUMN "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockedReason" TEXT;

-- Backfill subscription start date for existing active tenants.
UPDATE "Tenant"
SET "subscriptionStartDate" = COALESCE("subscriptionStartDate", "createdAt")
WHERE "subscriptionCurrentPeriodEnd" IS NOT NULL;

-- AlterTable
ALTER TABLE "User"
ALTER COLUMN "tenantId" DROP NOT NULL,
ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "blockedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TenantActivityLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantActivityLog_tenantId_createdAt_idx" ON "TenantActivityLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantActivityLog_actorUserId_idx" ON "TenantActivityLog"("actorUserId");

-- AddForeignKey
ALTER TABLE "TenantActivityLog"
ADD CONSTRAINT "TenantActivityLog_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantActivityLog"
ADD CONSTRAINT "TenantActivityLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
