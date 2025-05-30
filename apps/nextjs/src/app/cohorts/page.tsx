"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useTRPC } from "~/trpc/react";

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  "in progress": "bg-blue-100 text-blue-800 border-blue-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
} as const;

interface CohortData {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "in progress" | "archived";
  createdAt: Date;
  house?: {
    id: string;
    name: string;
  } | null;
}

const CohortCard = ({ cohort }: { cohort: CohortData }) => {
  const startDate = cohort.startDate;
  const endDate = cohort.endDate;
  const now = new Date();

  const isUpcoming = startDate > now;
  const isActive = startDate <= now && endDate >= now;
  const isPast = endDate < now;

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{cohort.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {cohort.house?.name || "No house assigned"}
            </p>
          </div>
          <Badge variant="outline" className={statusColors[cohort.status]}>
            {cohort.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 line-clamp-3 text-sm text-gray-600">
          {cohort.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Date:</span>
            <span>{startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End Date:</span>
            <span>{endDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span>
              {Math.ceil(
                (endDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDistanceToNow(cohort.createdAt)} ago</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isUpcoming && (
              <Badge variant="secondary" className="text-xs">
                Upcoming
              </Badge>
            )}
            {isActive && (
              <Badge variant="default" className="text-xs">
                Active Now
              </Badge>
            )}
            {isPast && (
              <Badge variant="outline" className="text-xs">
                Completed
              </Badge>
            )}
          </div>

          <Link href={`/cohorts/${cohort.id}`}>
            <Button variant="outline" size="sm">
              Apply
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const CohortSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="mb-4 h-12 w-full" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);

export default function CohortsPage() {
  const trpc = useTRPC();
  const {
    data: cohorts,
    isLoading,
    error,
  } = useQuery(trpc.cohort.getAll.queryOptions());

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Cohorts
          </h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cohorts</h1>
            <p className="text-gray-600">
              Discover and join learning cohorts in various houses
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CohortSkeleton key={i} />
          ))}
        </div>
      ) : cohorts && cohorts.length > 0 ? (
        <>
          <div className="mb-6 text-sm text-gray-600">
            Found {cohorts.length} cohort{cohorts.length !== 1 ? "s" : ""}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((cohort) => (
              <CohortCard key={cohort.id} cohort={cohort} />
            ))}
          </div>
        </>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto max-w-md">
            <h2 className="text-xl font-semibold text-gray-900">
              No cohorts found
            </h2>
            <p className="mt-2 text-gray-600">
              Get started by creating your first cohort.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
