"use client";

import { Button } from "@acme/ui/button";

import { useLoginDialog } from "~/hooks/use-login-dialog";

interface LoginButtonProps {
  children?: React.ReactNode;
  variant?:
    | "primary"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  className?: string;
}

export function LoginButton({
  children = "Login",
  variant = "primary",
  size = "md",
  className,
}: LoginButtonProps) {
  const { openLoginDialog } = useLoginDialog();

  return (
    <Button
      onClick={() => openLoginDialog()}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  );
}
