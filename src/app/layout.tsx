import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Script from "next/script";

import "@/app/globals.css";
import { ThemeToggle } from "@/components/theme-toggle";

const themeScript = `
  (() => {
    try {
      const storageKey = "barber-theme";
      const storedTheme = window.localStorage.getItem(storageKey);
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme =
        storedTheme === "light" || storedTheme === "dark"
          ? storedTheme
          : systemPrefersDark
            ? "dark"
            : "light";
      const root = document.documentElement;

      root.classList.toggle("dark", theme === "dark");
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    } catch {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: {
    default: "Nexora",
    template: "%s | Nexora"
  },
  description: "Nexora é a plataforma SaaS para agendamento, operação e gestão profissional de negócios de serviços.",
  applicationName: "Nexora"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
