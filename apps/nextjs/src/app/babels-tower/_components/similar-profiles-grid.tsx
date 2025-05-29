"use client";

import { useQuery } from "@tanstack/react-query";
import ClujhouseIcon from "~/components/clujhouse-icon";
import { ProfileCard } from "~/components/profile-card";
import { useTRPC } from "~/trpc/react";

export function SimilarProfilesCardGrid({ reverse }: {reverse?: boolean}) {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.similarProfiles.getSimilarUsers.queryOptions({ reverse }),
  );

  if (!data) {
    return <div className="flex h-full w-full items-center justify-center"><ClujhouseIcon /></div>;
  }


  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {data?.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
} 