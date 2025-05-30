"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Calendar, Check, Eye, Users, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Skeleton } from "@acme/ui/skeleton";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
} as const;

export default function ApplicationsAdminPage() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const [selectedCohort, setSelectedCohort] = useState<string>("");

  // Get all cohorts
  const { data: cohorts, isLoading: cohortsLoading } = useQuery(
    trpc.cohort.getAll.queryOptions(),
  );

  // Auto-select cohort from URL parameter
  useEffect(() => {
    const cohortParam = searchParams.get("cohort");
    if (cohortParam && cohorts?.some((c) => c.id === cohortParam)) {
      setSelectedCohort(cohortParam);
    }
  }, [searchParams, cohorts]);

  // Check if new endpoints are available
  const hasApplicationEndpoints = true; // Use direct API instead of TRPC for now

  // Get applications for selected cohort using direct API
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null,
  );

  // Fetch applications when cohort is selected
  useEffect(() => {
    if (!selectedCohort) {
      setApplications([]);
      return;
    }

    setApplicationsLoading(true);
    setApplicationsError(null);

    fetch(`/api/test-applications?cohortId=${selectedCohort}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplications(data.applications || []);
        } else {
          setApplicationsError(data.error || "Failed to fetch applications");
        }
      })
      .catch((error) => {
        setApplicationsError(error.message || "Network error");
      })
      .finally(() => {
        setApplicationsLoading(false);
      });
  }, [selectedCohort]);

  const handleStatusUpdate = (
    applicationId: string,
    status: "approved" | "rejected",
  ) => {
    if (!hasApplicationEndpoints) {
      toast.error("Service not available");
      return;
    }

    // Update the application status
    fetch("/api/update-application-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ applicationId, status }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast.success(
            `Application ${status === "approved" ? "approved" : "rejected"} successfully!`,
          );
          // Refresh the applications list
          if (selectedCohort) {
            setApplicationsLoading(true);
            fetch(`/api/test-applications?cohortId=${selectedCohort}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  setApplications(data.applications || []);
                }
              })
              .finally(() => {
                setApplicationsLoading(false);
              });
          }
        } else {
          toast.error(data.error || "Failed to update application status");
        }
      })
      .catch((error) => {
        toast.error("Network error: " + error.message);
      });
  };

  if (cohortsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Application Management</h1>
        <p className="text-muted-foreground">
          Review and manage cohort applications
        </p>
      </div>

      {/* Cohort Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Cohort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {cohorts?.map((cohort) => (
              <Button
                key={cohort.id}
                variant={selectedCohort === cohort.id ? "secondary" : "outline"}
                onClick={() => setSelectedCohort(cohort.id)}
                className="h-auto flex-col items-start justify-start p-4"
              >
                <div className="font-semibold">{cohort.name}</div>
                <div className="text-sm opacity-70">
                  {cohort.house?.name} • {cohort.status}
                </div>
                <div className="flex items-center gap-1 text-xs opacity-50">
                  <Calendar className="h-3 w-3" />
                  {cohort.startDate.toLocaleDateString()}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {selectedCohort && (
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <p className="text-sm text-muted-foreground">
              {!hasApplicationEndpoints
                ? "Database setup required to view applications"
                : applicationsLoading
                  ? "Loading applications..."
                  : `${applications.length} applications found`}
            </p>
          </CardHeader>
          <CardContent>
            {!hasApplicationEndpoints ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Database migration required to view applications.</p>
                <p className="mt-2 text-sm">
                  Run the database commands shown above to enable this feature.
                </p>
              </div>
            ) : applicationsError ? (
              <div className="py-8 text-center text-red-600">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Error loading applications: {applicationsError}</p>
              </div>
            ) : applicationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application: any) => (
                  <div
                    key={application.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{application.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {application.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Applied{" "}
                          {formatDistanceToNow(new Date(application.createdAt))}{" "}
                          ago
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            statusColors[
                              application.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {application.status}
                        </Badge>

                        {/* Application Details Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="mb-3 text-lg font-semibold">
                                  Basic Information
                                </h4>
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Name:</span>
                                    <span>{application.name}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span>Email:</span>
                                    <span>{application.email}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span>Social:</span>
                                    <span>{application.social}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      Are you local?
                                    </span>
                                    <span className="capitalize">
                                      {application.isLocal}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      Can you attend all days?
                                    </span>
                                    <span className="capitalize">
                                      {application.canAttendAllDays}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-3 text-lg font-semibold">
                                  Project Story
                                </h4>
                                <div className="rounded-md border p-4">
                                  <p className="text-sm leading-relaxed">
                                    {application.storyDescription}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-3 text-lg font-semibold">
                                  Project Metrics
                                </h4>
                                <div className="rounded-md border p-4">
                                  <p className="text-sm leading-relaxed">
                                    {application.projectMetrics}
                                  </p>
                                </div>
                              </div>

                              {application.image && (
                                <div>
                                  <h4 className="mb-3 text-lg font-semibold">
                                    Image
                                  </h4>
                                  <div className="rounded-md border p-4">
                                    <img
                                      src={application.image}
                                      alt="Application image"
                                      className="max-h-64 w-full rounded-md object-contain"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span>Project: </span>
                        <span>
                          {application.storyDescription.length > 100
                            ? application.storyDescription.substring(0, 100) +
                              "..."
                            : application.storyDescription}
                        </span>
                      </div>
                      <div>
                        <span>Metrics: </span>
                        <span>{application.projectMetrics}</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span>
                          Local:{" "}
                          <span className="capitalize">
                            {application.isLocal}
                          </span>
                        </span>
                        <span>
                          Full attendance:{" "}
                          <span className="capitalize">
                            {application.canAttendAllDays}
                          </span>
                        </span>
                      </div>
                    </div>

                    {application.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(application.id, "approved")
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleStatusUpdate(application.id, "rejected")
                          }
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No applications found for this cohort.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedCohort && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Select a cohort above to view applications.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
