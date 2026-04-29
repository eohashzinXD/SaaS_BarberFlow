import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--accent))_120%)] text-primary-foreground shadow-[0_14px_30px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:opacity-95",
        secondary:
          "border border-border/[0.8] bg-secondary/[0.8] text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary",
        outline:
          "border border-border bg-card/[0.9] text-foreground shadow-[0_10px_26px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-primary/[0.35] hover:bg-secondary/[0.7]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_14px_28px_rgba(220,38,38,0.24)] hover:-translate-y-0.5 hover:opacity-95",
        ghost: "text-foreground hover:bg-secondary/[0.7]"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-6",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
