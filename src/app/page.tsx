import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-8">
          <span className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
            BarberFlow
          </span>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              Gerencie seus cortes de forma simples e eficiente.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Cadastre sua barbearia, publique sua página em segundos e gerencie serviços,
              horários e agendamentos.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              href="/register"
            >
              Criar minha barbearia
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
              href="/login"
            >
              Entrar no painel
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-xl shadow-primary/5 backdrop-blur">
          <div className="space-y-6">
            <div className="rounded-2xl bg-secondary p-5">
              <p className="text-sm font-medium text-muted-foreground">Hoje</p>
              <p className="mt-2 text-3xl font-bold">12 agendamentos</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-5">
                <p className="text-sm text-muted-foreground">Barbeiros</p>
                <p className="mt-2 text-2xl font-bold">4 ativos</p>
              </div>
              <div className="rounded-2xl border border-border p-5">
                <p className="text-sm text-muted-foreground">Serviços</p>
                <p className="mt-2 text-2xl font-bold">9 publicados</p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-border p-5">
              <p className="text-sm text-muted-foreground">
                Página pública pronta para SEO e fluxo de booking sem login.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
