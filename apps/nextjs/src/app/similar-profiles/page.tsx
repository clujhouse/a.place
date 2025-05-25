import { Suspense } from "react";

import { PageHeader } from "~/components/page-header";
import { SimilarProfilesCardGrid } from "./_components/similar-profiles-grid";
import { SimilarProfilesSkeleton } from "./_components/similar-profiles-skeleton";

export const metadata = {
  title: "similar Profiles",
  description: "discover users with similar interests and profiles",
};

export default function SimilarProfilesPage() {
  return (
    <div className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <PageHeader
        title="similar Profiles"
        description="discover users with similar interests and profiles"
      />

      <Suspense fallback={<SimilarProfilesSkeleton />}>
        <SimilarProfilesCardGrid />
      </Suspense>

      <PageHeader
        title="opposite Profiles"
        description="discover users with opposite interests and profiles"
      />
      <Suspense fallback={<SimilarProfilesSkeleton />}>
        <SimilarProfilesCardGrid reverse />
      </Suspense>
    </div>
  );
}
