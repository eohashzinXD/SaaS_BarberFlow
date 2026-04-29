import { CheckCircle2 } from "lucide-react";

import { BrandLockup } from "@/components/brand";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  children: React.ReactNode;
  className?: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  bullets,
  children,
  className
}: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(6,14,32,0.96),rgba(17,34,67,0.88))] p-8 text-white shadow-[0_32px_96px_rgba(15,23,42,0.32)] sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(72,149,239,0.32),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div className="space-y-10">
              <BrandLockup subtitle="Scheduling and operations platform" tone="light" />
              <div className="space-y-4">
                <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
                  {eyebrow}
                </span>
                <div className="space-y-3">
                  <h1 className="max-w-xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-slate-200">{description}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-slate-100 backdrop-blur"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={cn("flex items-center", className)}>
          <div className="w-full">{children}</div>
        </section>
      </div>
    </main>
  );
}
