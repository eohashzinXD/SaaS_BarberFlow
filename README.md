# Barber SaaS

SaaS de agendamento para barbearias com Next.js App Router, TypeScript strict, PostgreSQL, Prisma, Auth.js v5, Tailwind CSS, componentes no estilo shadcn/ui e cobrança recorrente via AbacatePay.

## Stack

- Next.js 15 com App Router
- React 19
- TypeScript strict
- PostgreSQL 16
- Prisma ORM
- Auth.js v5 com Credentials
- Tailwind CSS
- Docker / Docker Compose
- Vitest para unitários e integração
- Playwright para E2E

## Decisões

- Multi-tenant lógico por `tenantId` em toda query autenticada.
- `tenantId` e `role` são derivados da sessão no servidor, nunca do cliente.
- Server Actions são usadas para mutations do painel e do booking público.
- O build do Next ignora lint e type-check embutidos, e a checagem oficial fica explícita via `npm run lint` e `npx tsc --noEmit`.
  Motivo: em alguns runtimes com Node 24 o worker interno do `next build` falha de forma opaca, enquanto `tsc` e ESLint passam normalmente.
- As migrações estão versionadas em `prisma/migrations`.

## Fluxos entregues

- Cadastro inicia o checkout recorrente no AbacatePay e só provisiona tenant, perfil público e usuário `ADMIN` após a confirmação do webhook.
- Login com Credentials (`email + senha`) usando Auth.js.
- Middleware protege `/dashboard/*`.
- Página pública em `/barbearia/[slug]` com SSR/on-demand rendering.
- Fluxo público de booking sem login com cálculo dinâmico de slots.
- Painel com dashboard, barbeiros, serviços, agenda, status, remarcação e configurações.
- Seed com tenant demo, 2 barbeiros, 3 serviços e horários configurados.

## Estrutura

```text
/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── server/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Variáveis de ambiente

Defina as variáveis abaixo no ambiente local ou na Vercel.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-long-random-string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barbersaas?schema=public
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barbersaas_test?schema=public
APP_TIMEZONE=America/Sao_Paulo
ABACATEPAY_API_URL=https://api.abacatepay.com/v2
ABACATEPAY_API_KEY=sua-chave-api
ABACATEPAY_PRODUCT_ID=id-do-produto-assinatura
ABACATEPAY_WEBHOOK_SECRET=segredo-configurado-na-url-do-webhook
ABACATEPAY_WEBHOOK_PUBLIC_KEY=chave-hmac-publica-do-webhook
```

Webhook sugerido no painel do AbacatePay:

```text
POST {NEXT_PUBLIC_APP_URL}/api/abacatepay/webhook?webhookSecret={ABACATEPAY_WEBHOOK_SECRET}
```

## Deploy na Vercel

- Garanta que a `DATABASE_URL` de produção aponte para o banco correto. Se estiver usando Neon compartilhado, prefira isolar o app com `?schema=barbersaas`.
- O Prisma Client agora é regenerado em `postinstall` e antes do `build`, evitando deploy com client desatualizado após mudanças no `schema.prisma`.
- Rode `npx prisma migrate deploy` no banco de produção antes de validar o login e o painel.
- Configure também `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `APP_TIMEZONE` e as chaves do AbacatePay no ambiente de produção.

## Rodando com Docker

Suba tudo com um único comando:

```bash
docker compose up --build
```

O serviço `app` executa automaticamente:

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev:docker
```

Serviços do compose:

- `db`: PostgreSQL 16 com volume persistente e healthcheck.
- `app`: Next.js em modo desenvolvimento.

## Rodando localmente sem Docker

1. Suba um PostgreSQL local ou use `docker compose up -d db`
2. Instale dependências:

```bash
npm install
```

3. Gere client, aplique migrations e seed:

```bash
npm run db:generate
npx prisma migrate deploy
npm run db:seed
```

4. Rode a aplicação:

```bash
npm run dev
```

## Credenciais demo

- URL pública: `http://localhost:3000/barbearia/barbearia-demo`
- Admin: `admin@demo.com`
- Senha: `admin123456`

## Scripts principais

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
npm run test:e2e
npm run db:migrate
npm run db:seed
npm run db:studio
```

Scripts úteis adicionais:

```bash
npm run test:unit
npm run test:integration
npm run test:db:prepare
npm run docker:init
```

## Testes

Unitários:

- cálculo de slots disponíveis
- conflito de horários
- transição de status

Integração:

- isolamento entre tenants
- fluxo de registro
- proteção de rotas

E2E:

- registro de nova barbearia
- login e redirecionamento
- cadastro de serviço
- cadastro de barbeiro
- booking público completo

Preparação recomendada para integração/E2E:

```bash
docker compose up -d db
npm run test:db:prepare
```

Depois:

```bash
npm run test:integration
npm run test:e2e
```

## Segurança e isolamento

- Todas as queries autenticadas filtram por `tenantId`.
- O helper `requireTenantSession()` centraliza sessão e tenant no servidor.
- Inputs de actions e fluxo público usam Zod.
- Senhas são hasheadas com `bcryptjs`.
- O middleware só libera `/dashboard/*` com sessão válida.
- O acesso ao painel também depende de `billingStatus = ACTIVE`, atualizado pelos webhooks do AbacatePay.
- O booking público valida conflito, horário passado, duração do serviço e horário de funcionamento.
