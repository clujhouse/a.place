import { Card, CardContent, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

export function SimilarProfilesSkeleton() {
  // Create an array of 8 skeleton cards
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="w-full py-3 px-2 gap-2">
          <CardHeader className="flex flex-row items-center p-0 pb-2">
            <Skeleton className="h-12 w-12 rounded-full" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 