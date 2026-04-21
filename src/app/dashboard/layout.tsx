import Link from "next/link";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/server/actions/auth";
import { requireTenantSession } from "@/server/auth/tenant-session";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/barbers", label: "Barbeiros" },
  { href: "/dashboard/services", label: "Serviços" },
  { href: "/dashboard/appointments", label: "Agenda" },
  { href: "/dashboard/settings", label: "Configurações" }
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
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="w-full rounded-[1.75rem] border border-border bg-card p-6 lg:sticky lg:top-6 lg:w-72 lg:self-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Painel da barbearia</p>
            <h2 className="text-2xl font-bold">{tenant?.name ?? "Minha barbearia"}</h2>
            <p className="text-sm text-muted-foreground">{session.email}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

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
