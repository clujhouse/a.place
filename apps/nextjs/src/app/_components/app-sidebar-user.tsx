import React from "react";
import Link from "next/link";

import { authClient } from "@acme/auth/client";
import { Button } from "@acme/ui/button";

export const AppSidebarUser = () => {
  const { data, isPending } = authClient.useSession();

  if (isPending || !data)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Link href="/login" className="w-full">
          <Button className="w-full">log in</Button>
        </Link>
      </div>
    );

  return null;
};
