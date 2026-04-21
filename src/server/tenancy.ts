export function withTenantScope<T extends Record<string, unknown>>(tenantId: string, where?: T) {
  return {
    tenantId,
    ...(where ?? {})
  };
}

export function assertTenantOwnership(recordTenantId: string, sessionTenantId: string) {
  if (recordTenantId !== sessionTenantId) {
    throw new Error("Tenant mismatch.");
  }
}
