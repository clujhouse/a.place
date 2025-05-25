"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@acme/auth/client";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = "/login",
}: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(redirectTo);
    }
  }, [session, isPending, router, redirectTo]);

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
    return null; // Will redirect
  }

  return <>{children}</>;
}
