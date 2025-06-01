"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Globe, Instagram, Linkedin, Twitter } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Icon } from "@acme/ui/icon";
import { Skeleton } from "@acme/ui/skeleton";

import { SvgIcon } from "~/components/svg-icon";
import { SvgIconSafe } from "~/components/svg-icon-safe";
import { useTRPC } from "~/trpc/react";

export default function HouseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const trpc = useTRPC();

  const {
    data: house,
    isLoading,
    error,
  } = useQuery(trpc.house.getBySlug.queryOptions(slug));

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="mb-8 h-6 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">House Not Found</h1>
          <p className="text-muted-foreground">
            {error?.message || "The house you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/babels-tower")} className="mt-4">
            Back to Houses
          </Button>
        </div>
      </div>
    );
  }

  const socialIcons = {
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    website: Globe,
  };

  return (
    <div className="flex flex-col border-r">
      <div className="flex items-center gap-2 border-b p-4">
        <Link href="/babels-tower">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            babel's tower
          </h1>
        </Link>
        <p className="text-xl font-semibold"> / {house.name}</p>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col">
          <SvgIcon src={house.logoUrl} alt={house.name} className="h-16 w-16" />
        </div>
        <div className="flex gap-2">
          {house.socialLinks?.map((link) => (
            <Link
              className="flex items-center gap-2"
              href={link.url}
              key={link.type}
            >
              <Icon as={socialIcons[link.type]} />
              <p className="text-sm">{link.type}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
