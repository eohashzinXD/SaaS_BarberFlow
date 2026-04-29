import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { requireSuperAdminSession } from "@/server/auth/tenant-session";

const links = [
  { href: "/super-admin", label: "Visão geral", icon: "shield" as const },
  { href: "/super-admin/barbershops", label: "Operações", icon: "analytics" as const },
  { href: "/super-admin/users", label: "Usuários", icon: "team" as const }
];

type SuperAdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const session = await requireSuperAdminSession();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row lg:px-8">
        <aside className="surface-panel w-full p-6 lg:sticky lg:top-6 lg:w-80 lg:self-start">
          <div className="space-y-6">
            <BrandLockup subtitle="Platform command center" />
            <div className="surface-muted flex items-start gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/[0.12] text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Admin console
                </p>
                <h2 className="font-display text-xl font-semibold">Nexora Platform</h2>
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
            Esta área centraliza tenants, usuários, bloqueios e billing da plataforma inteira com leitura operacional.
          </div>

          <div className="mt-8 space-y-3">
            <Button asChild className="w-full" variant="secondary">
              <Link href="/">Ver site público</Link>
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
