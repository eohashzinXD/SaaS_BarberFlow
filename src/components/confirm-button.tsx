"use client";

import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmButtonProps = ButtonProps & {
  confirmationMessage: string;
};

export function ConfirmButton({
  confirmationMessage,
  onClick,
  children,
  ...props
}: ConfirmButtonProps) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmationMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
