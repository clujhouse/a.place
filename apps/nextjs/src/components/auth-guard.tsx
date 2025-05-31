"use client";

import { useEffect } from "react";

import { authClient } from "@acme/auth/client";

import { useLoginDialog } from "~/hooks/use-login-dialog";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { openLoginDialog } = useLoginDialog();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      openLoginDialog("auth_guard");
    }
  }, [session, isPending, openLoginDialog]);

  if (isPending) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  if (!session?.user) {
    return null; // Will show login dialog
  }

  return <>{children}</>;
}
