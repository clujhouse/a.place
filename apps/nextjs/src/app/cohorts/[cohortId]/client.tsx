"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { generateReactHelpers } from "@uploadthing/react";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock, MapPin, Settings, Users } from "lucide-react";

import { authClient } from "@acme/auth/client";
import { RadioGroup, RadioGroupItem } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { useTRPC } from "~/trpc/react";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface CohortPageClientProps {
  cohortId: string;
}

export default function CohortPageClient({ cohortId }: CohortPageClientProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    social: "",
    storyDescription: "",
    projectMetrics: "",
    image: null as File | null,
    isLocal: "",
    canAttendAllDays: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("profileImages");

  const {
    data: cohort,
    isLoading,
    error,
    refetch: refetchCohort,
  } = useQuery(trpc.cohort.getById.queryOptions(cohortId));

  const submitApplicationMutation = useMutation({
    mutationFn: async (applicationData: any) => {
      const response = await fetch("/api/submit-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit application");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      setFormData({
        name: "",
        email: "",
        social: "",
        storyDescription: "",
        projectMetrics: "",
        image: null,
        isLocal: "",
        canAttendAllDays: "",
      });
      // Refresh the cohort data to update application status
      void refetchCohort();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit application");
    },
    onSettled: () => {
      setIsSubmitting(false);
      setIsUploading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("You must be logged in to apply");
      return;
    }

    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.storyDescription ||
      !formData.projectMetrics ||
      !formData.isLocal ||
      !formData.canAttendAllDays
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (formData.image) {
        setIsUploading(true);
        const uploadedFiles = await startUpload([formData.image]);
        if (!uploadedFiles?.[0]) {
          toast.error("Failed to upload image");
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
        imageUrl = uploadedFiles[0].url;
      }

      // Submit application
      await submitApplicationMutation.mutateAsync({
        cohortId: cohortId,
        name: formData.name,
        email: formData.email,
        social: formData.social,
        storyDescription: formData.storyDescription,
        projectMetrics: formData.projectMetrics,
        image: imageUrl,
        isLocal: formData.isLocal,
        canAttendAllDays: formData.canAttendAllDays,
      });
    } catch (error) {
      console.error("Application submission error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cohort Not Found</h1>
          <p className="text-gray-600">
            {error?.message || "The cohort you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/cohorts")} className="mt-4">
            Back to Cohorts
          </Button>
        </div>
      </div>
    );
  }

  const startDate = cohort.startDate;
  const endDate = cohort.endDate;
  const now = new Date();

  const isUpcoming = startDate > now;
  const isActive = startDate <= now && endDate >= now;
  const isPast = endDate < now;

  // Check if user has already applied or is a member
  const userMembership = cohort.members?.find(
    (member) => member.userId === session?.user?.id,
  );

  const userApplication = (cohort as any).applications?.find(
    (app: any) => app.userId === session?.user?.id,
  );

  const canApply =
    !userMembership && !userApplication && !isPast && session?.user;

  // Check if current user is the house owner
  const isHouseOwner = session?.user?.id === cohort.house?.ownerId;

  return (
    <div className="container mx-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => router.push("/cohorts")}
              className="hover:text-foreground"
            >
              Cohorts
            </button>
            <span>/</span>
            <span>{cohort.name}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{cohort.name}</h1>
              <p className="text-lg text-muted-foreground">
                {cohort.house?.name || "No house assigned"}
              </p>
            </div>
            <Badge variant="outline">{cohort.status}</Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 md:col-span-2">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Cohort</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {cohort.description}
                </p>
              </CardContent>
            </Card>

            {/* Application Form */}
            {canApply && (
              <Card>
                <CardHeader>
                  <CardTitle>Apply to Join</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Complete all fields below to submit your application.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          disabled={isSubmitting || isUploading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          disabled={isSubmitting || isUploading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="social">Social *</Label>
                        <Input
                          id="social"
                          placeholder="Your social media handles (Twitter, LinkedIn, etc.)"
                          value={formData.social}
                          onChange={(e) =>
                            setFormData({ ...formData, social: e.target.value })
                          }
                          disabled={isSubmitting || isUploading}
                        />
                      </div>
                    </div>

                    {/* Project Story */}
                    <div>
                      <Label htmlFor="storyDescription">
                        Cool. What are you working on right now? 1-2 sentences
                        is fine. Plz drop a link to it if you have one. *
                      </Label>
                      <p className="mb-2 text-sm text-muted-foreground">
                        Give us the project's name (if you have one), the
                        one-liner, and what you're trying to do!
                        <br />
                        Also, if you got a link, be sure to include it below as
                        well (make sure https is included in the link)
                      </p>
                      <Textarea
                        id="storyDescription"
                        placeholder="i'm building a school for makers, check it out https://buildspace.so"
                        value={formData.storyDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            storyDescription: e.target.value,
                          })
                        }
                        className="min-h-24"
                        disabled={isSubmitting || isUploading}
                      />
                    </div>

                    {/* Project Metrics */}
                    <div>
                      <Label htmlFor="projectMetrics">
                        How far along is your project rn in terms of numbers? *
                      </Label>
                      <p className="mb-2 text-sm text-muted-foreground">
                        We just wanna get a sense of where you are at with it.
                        Ex: $100 in revenue, 10,000 yt subscribers, 1,000
                        sign-ups, $10k mrr, 2,500 monthly listeners, whatever!
                        And if you're at zero then that's cool too.
                      </p>
                      <Input
                        id="projectMetrics"
                        placeholder="20 subscribers on youtube!"
                        value={formData.projectMetrics}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectMetrics: e.target.value,
                          })
                        }
                        disabled={isSubmitting || isUploading}
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <Label htmlFor="image">Add 1 image</Label>
                      <p className="mb-2 text-sm text-muted-foreground">
                        Imagine someone could only see this one piece of content
                        to understand what you do or who you are, what would you
                        show?
                        <br />
                        Ex: screenshot of your app, screenshot of a tweet that
                        blew up, pic of clothing you made, pic of you rock
                        climbing (if you really love rock climbing).
                      </p>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFormData({ ...formData, image: file });
                        }}
                        disabled={isSubmitting || isUploading}
                      />
                      {isUploading && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Uploading image...
                        </p>
                      )}
                    </div>

                    {/* Location & Attendance */}
                    <div className="space-y-4">
                      <div>
                        <Label>Are you local? *</Label>
                        <RadioGroup
                          value={formData.isLocal}
                          onValueChange={(value: string) =>
                            setFormData({ ...formData, isLocal: value })
                          }
                          className="mt-2 flex space-x-4"
                          disabled={isSubmitting || isUploading}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="local-yes" />
                            <Label htmlFor="local-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="local-no" />
                            <Label htmlFor="local-no">No</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label>Can you attend all days? *</Label>
                        <RadioGroup
                          value={formData.canAttendAllDays}
                          onValueChange={(value: string) =>
                            setFormData({
                              ...formData,
                              canAttendAllDays: value,
                            })
                          }
                          className="mt-2 flex space-x-4"
                          disabled={isSubmitting || isUploading}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="attend-yes" />
                            <Label htmlFor="attend-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="attend-no" />
                            <Label htmlFor="attend-no">No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        isUploading ||
                        !formData.name.trim() ||
                        !formData.email.trim() ||
                        !formData.social.trim() ||
                        !formData.storyDescription.trim() ||
                        !formData.projectMetrics.trim() ||
                        !formData.isLocal.trim() ||
                        !formData.canAttendAllDays.trim()
                      }
                      className="w-full"
                    >
                      {isSubmitting
                        ? isUploading
                          ? "Uploading..."
                          : "Submitting..."
                        : "Submit Application"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* User's Application Status */}
            {userApplication && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">
                    {userApplication.status.charAt(0).toUpperCase() +
                      userApplication.status.slice(1)}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {userApplication.status === "pending" &&
                      "Your application is being reviewed."}
                    {userApplication.status === "approved" &&
                      "Congratulations! Your application has been approved."}
                    {userApplication.status === "rejected" &&
                      "Your application was not accepted this time."}
                  </p>

                  {/* Show application details */}
                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <strong>Project:</strong>{" "}
                      {userApplication.storyDescription}
                    </p>
                    <p>
                      <strong>Metrics:</strong> {userApplication.projectMetrics}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(userApplication.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legacy User's Membership Status */}
            {userMembership && !userApplication && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Membership Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">
                    {userMembership.status.charAt(0).toUpperCase() +
                      userMembership.status.slice(1)}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {userMembership.status === "pending" &&
                      "Your membership is being processed."}
                    {userMembership.status === "accepted" &&
                      "You are a member of this cohort."}
                    {userMembership.status === "rejected" &&
                      "Your membership was not approved."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Members */}
            {cohort.members && cohort.members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Members (
                    {
                      cohort.members.filter((m) => m.status === "accepted")
                        .length
                    }
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cohort.members
                      .filter((member) => member.status === "accepted")
                      .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Member
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cohort Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cohort Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {startDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">
                      {endDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil(
                        (endDate.getTime() - startDate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}{" "}
                      days
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Members</p>
                    <p className="text-sm text-muted-foreground">
                      {cohort.members?.filter((m) => m.status === "accepted")
                        .length || 0}{" "}
                      accepted
                    </p>
                  </div>
                </div>

                {cohort.house && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">House</p>
                      <p className="text-sm text-muted-foreground">
                        {cohort.house.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(cohort.createdAt)} ago
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Indicators */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {isUpcoming && (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center"
                    >
                      Starting Soon
                    </Badge>
                  )}
                  {isActive && (
                    <Badge variant="default" className="w-full justify-center">
                      Currently Active
                    </Badge>
                  )}
                  {isPast && (
                    <Badge variant="outline" className="w-full justify-center">
                      Completed
                    </Badge>
                  )}

                  {/* House Owner Management Button */}
                  {isHouseOwner && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/applications?cohort=${cohort.id}`)
                        }
                        className="w-full"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Applications
                      </Button>
                    </div>
                  )}

                  {!session?.user && (
                    <div className="pt-2 text-center">
                      <p className="mb-2 text-sm text-muted-foreground">
                        Login to apply
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/login")}
                        className="w-full"
                      >
                        Login
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
