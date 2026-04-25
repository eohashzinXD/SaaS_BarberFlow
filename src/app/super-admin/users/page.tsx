import Link from "next/link";
import { Role } from "@prisma/client";

import { ConfirmButton } from "@/components/confirm-button";
import { FlashMessage } from "@/components/flash-message";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/formatters";
import { getFlashFromSearchParams } from "@/lib/navigation";
import {
  deleteSuperAdminUserAction,
  toggleSuperAdminUserBlockAction,
  updateSuperAdminUserAction
} from "@/server/actions/super-admin";
import { listSuperAdminUsers } from "@/server/super-admin";

type SuperAdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getRoleOptions(role: Role) {
  if (role === Role.SUPER_ADMIN) {
    return [{ value: Role.SUPER_ADMIN, label: "SUPER_ADMIN" }];
  }

  return [
    { value: Role.ADMIN, label: "ADMIN" },
    { value: Role.STAFF, label: "STAFF" },
    { value: Role.CUSTOMER, label: "CUSTOMER" }
  ];
}

export default async function SuperAdminUsersPage({
  searchParams
}: SuperAdminUsersPageProps) {
  const params = await searchParams;
  const flash = getFlashFromSearchParams(params);
  const { filters, users } = await listSuperAdminUsers(params);
  const currentPath = `/super-admin/users${filters.query ? `?${new URLSearchParams({ query: filters.query }).toString()}` : ""}`;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Usuários"
        description="Edite acessos globais, vínculos com tenants e bloqueios individuais."
      />

      {flash.success ? <FlashMessage message={flash.success} type="success" /> : null}
      {flash.error ? <FlashMessage message={flash.error} type="error" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Busca</CardTitle>
          <CardDescription>Pesquise por nome, e-mail, tenant ou slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="query">Busca</Label>
              <Input defaultValue={filters.query ?? ""} id="query" name="query" placeholder="Nome ou e-mail" />
            </div>
            <div className="flex items-end gap-3">
              <Button type="submit">Aplicar</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/super-admin/users">Limpar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Usuários encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bloqueados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.filter((user) => user.isBlocked).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {users.filter((user) => user.role === Role.SUPER_ADMIN).length}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-bold">{user.name}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isBlocked
                          ? "bg-rose-100 text-rose-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {user.isBlocked ? "Bloqueado" : "Ativo"}
                    </span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-900">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.tenant
                      ? `${user.tenant.name} • /${user.tenant.slug}`
                      : "Conta interna da plataforma"}
                  </p>
                  <p className="text-sm text-muted-foreground">Criado em {formatDate(user.createdAt)}</p>
                </div>
              </div>

              <form action={updateSuperAdminUserAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input name="userId" type="hidden" value={user.id} />
                <input name="redirectTo" type="hidden" value={currentPath} />
                <div className="space-y-2">
                  <Label htmlFor={`name-${user.id}`}>Nome</Label>
                  <Input defaultValue={user.name} id={`name-${user.id}`} name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`email-${user.id}`}>E-mail</Label>
                  <Input
                    defaultValue={user.email}
                    id={`email-${user.id}`}
                    name="email"
                    required
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`role-${user.id}`}>Role</Label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={user.role}
                    id={`role-${user.id}`}
                    name="role"
                  >
                    {getRoleOptions(user.role).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit">Salvar</Button>
                </div>
              </form>

              <div className="flex flex-wrap gap-3">
                <form action={toggleSuperAdminUserBlockAction}>
                  <input name="userId" type="hidden" value={user.id} />
                  <input name="redirectTo" type="hidden" value={currentPath} />
                  <ConfirmButton
                    confirmationMessage={
                      user.isBlocked
                        ? `Desbloquear o usuário ${user.email}?`
                        : `Bloquear o usuário ${user.email}?`
                    }
                    size="sm"
                    type="submit"
                    variant={user.isBlocked ? "default" : "outline"}
                  >
                    {user.isBlocked ? "Desbloquear" : "Bloquear"}
                  </ConfirmButton>
                </form>

                <form action={deleteSuperAdminUserAction}>
                  <input name="userId" type="hidden" value={user.id} />
                  <input name="redirectTo" type="hidden" value={currentPath} />
                  <ConfirmButton
                    confirmationMessage={`Excluir o usuário ${user.email}?`}
                    size="sm"
                    type="submit"
                    variant="destructive"
                  >
                    Excluir
                  </ConfirmButton>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}

        {!users.length ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum usuário encontrado para os filtros informados.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
