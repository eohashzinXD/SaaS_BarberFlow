import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Barber SaaS",
  description: "Plataforma SaaS de agendamento para barbearias com multi-tenant seguro."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
