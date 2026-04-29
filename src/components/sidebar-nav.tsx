"use client";

import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Scissors,
  Settings,
  Shield,
  Sparkles,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const icons = {
  analytics: BarChart3,
  appointments: CalendarDays,
  dashboard: LayoutDashboard,
  services: Sparkles,
  settings: Settings,
  shield: Shield,
  team: Users,
  barbers: Scissors
};

type SidebarLink = {
  href: string;
  label: string;
  icon: keyof typeof icons;
};

type SidebarNavProps = {
  links: SidebarLink[];
};

export function SidebarNav({ links }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {links.map((link) => {
        const Icon = icons[link.icon];
        const isActive =
          pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));

        return (
          <Link
            key={link.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
              isActive
                ? "border-primary/[0.25] bg-primary/[0.1] text-foreground shadow-[0_12px_30px_rgba(37,99,235,0.12)]"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-white/60 hover:text-foreground dark:hover:bg-white/5"
            )}
            href={link.href}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/[0.8] text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
