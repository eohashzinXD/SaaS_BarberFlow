import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { requireSuperAdminSession } from "@/server/auth/tenant-session";

const links = [
  { href: "/super-admin", label: "Dashboard" },
  { href: "/super-admin/barbershops", label: "Barbearias" },
  { href: "/super-admin/users", label: "Usuários" }
];

type SuperAdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const session = await requireSuperAdminSession();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="w-full rounded-[1.75rem] border border-border bg-card p-6 lg:sticky lg:top-6 lg:w-80 lg:self-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Painel de plataforma</p>
            <h2 className="text-2xl font-bold">Super Admin</h2>
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

          <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
            Esta área gerencia tenants, usuários, bloqueios e assinaturas da plataforma inteira.
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
