import { Suspense } from "react";

import { PageHeader } from "~/components/page-header";
import { SimilarProfilesSkeleton } from "./_components/similar-profiles-skeleton";
import { SimilarProfilesCardGrid } from "./_components/similar-profiles-grid";

export const metadata = {
  title: "Similar Profiles",
  description: "Discover users with similar interests and profiles",
};

export default function SimilarProfilesPage() {
  return (
    <div className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <PageHeader
        title="Similar Profiles"
        description="Discover users with similar interests and profiles"
      />
      
      <Suspense fallback={<SimilarProfilesSkeleton />}>
        <SimilarProfilesCardGrid />
      </Suspense>
    </div>
  );
} 