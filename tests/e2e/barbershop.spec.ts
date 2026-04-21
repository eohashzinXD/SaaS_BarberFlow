import { expect, test } from "@playwright/test";

const hasAbacateCheckout =
  process.env.ABACATEPAY_API_KEY &&
  process.env.ABACATEPAY_PRODUCT_ID &&
  process.env.ABACATEPAY_WEBHOOK_SECRET &&
  process.env.ABACATEPAY_WEBHOOK_PUBLIC_KEY;

const suffix = `${Date.now()}`;
const account = {
  ownerName: "Dono Playwright",
  email: `owner-${suffix}@example.com`,
  password: "senha12345",
  barbershopName: `Barbearia PW ${suffix}`,
  slug: `barbearia-pw-${suffix}`
};

test.describe("onboarding pago", () => {
  test.skip(!hasAbacateCheckout, "registro pago depende do AbacatePay configurado");

  test("registro redireciona para o checkout do gateway", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Seu nome").fill(account.ownerName);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Nome da barbearia").fill(account.barbershopName);
    await page.getByLabel("Slug público").fill(account.slug);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Criar conta e ir para pagamento" }).click();

    await expect(page).toHaveURL(/abacatepay|checkout/);
  });
});

test("login e cadastro de serviço e barbeiro", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("E-mail").fill("admin@demo.com");
  await page.getByLabel("Senha").fill("admin123456");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/services/new");
  await page.getByLabel("Nome").fill("Corte Teste");
  await page.getByLabel("Duração (minutos)").fill("45");
  await page.getByLabel("Preço").fill("65.00");
  await page.getByLabel("Descrição").fill("Serviço criado pelo Playwright.");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page).toHaveURL(/\/dashboard\/services/);
  await expect(page.getByText("Corte Teste")).toBeVisible();

  await page.goto("/dashboard/barbers/new");
  await page.getByLabel("Nome").fill("Barbeiro Teste");
  await page.getByRole("button", { name: "Salvar barbeiro" }).click();
  await expect(page).toHaveURL(/\/dashboard\/barbers/);
  await expect(page.getByText("Barbeiro Teste")).toBeVisible();
});

test("agendamento completo pela página pública demo", async ({ page }) => {
  await page.goto("/barbearia/barbearia-demo");

  await page.getByLabel("Serviço").selectOption({ index: 1 });
  await page.getByLabel("Barbeiro").selectOption({ index: 1 });
  await page.getByLabel("Data").fill("2026-04-20");
  await page.getByRole("button", { name: "Ver horários disponíveis" }).click();

  await page.getByRole("link", { name: "09:45" }).click();
  await page.getByLabel("Nome do cliente").fill("Cliente Playwright");
  await page.getByLabel("E-mail").last().fill("cliente-playwright@example.com");
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();

  await expect(page.getByText("Agendamento criado com sucesso")).toBeVisible();
});
