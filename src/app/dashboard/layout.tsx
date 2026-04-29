import { Building2 } from "lucide-react";
import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/server/actions/auth";
import { requireTenantSession } from "@/server/auth/tenant-session";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: "dashboard" as const },
  { href: "/dashboard/barbers", label: "Equipe", icon: "barbers" as const },
  { href: "/dashboard/services", label: "Serviços", icon: "services" as const },
  { href: "/dashboard/appointments", label: "Agenda", icon: "appointments" as const },
  { href: "/dashboard/settings", label: "Configurações", icon: "settings" as const }
];

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await requireTenantSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      name: true,
      slug: true
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row lg:px-8">
        <aside className="surface-panel w-full p-6 lg:sticky lg:top-6 lg:w-80 lg:self-start">
          <div className="space-y-6">
            <BrandLockup subtitle="Painel operacional" />
            <div className="surface-muted flex items-start gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/[0.12] text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Workspace
                </p>
                <h2 className="font-display text-xl font-semibold">{tenant?.name ?? "Minha operação"}</h2>
                <p className="text-sm text-muted-foreground">{session.email}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Navegação
            </p>
            <SidebarNav links={links} />
          </div>

          <div className="mt-8 rounded-[1.35rem] border border-border/[0.8] bg-secondary/[0.65] p-4 text-sm text-muted-foreground">
            A Nexora centraliza sua agenda, catálogo e equipe com uma operação mais organizada e previsível.
          </div>

          <div className="mt-8 space-y-3">
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/barbearia/${tenant?.slug ?? ""}`}>Ver página pública</Link>
            </Button>
            <form action={logoutAction}>
              <Button className="w-full" variant="outline">
                Sair
              </Button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
