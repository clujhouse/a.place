import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { User } from "lucide-react";

import { createCaller, createTRPCContext } from "@acme/api";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { MarkdownContent } from "@acme/ui/markdown-content";

import { HouseBadge } from "~/components/house-badge";
import { SendLetterButton } from "~/components/send-letter-button";

interface PublicProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { userId } = await params;

  try {
    const heads = new Headers(await headers());
    const ctx = await createTRPCContext({ headers: heads });
    const trpc = createCaller(ctx);
    const profile = await trpc.profile.getById(userId);

    if (!profile) {
      return {
        title: "Profile Not Found",
        description: "The requested profile could not be found.",
      };
    }

    const userName = profile.user?.name || "Unknown User";
    const shortBio = profile.shortBio || `${userName}'s profile`;

    return {
      title: `${userName} - Profile`,
      description: shortBio,
      openGraph: {
        title: `${userName} - Profile`,
        description: shortBio,
        images: profile.user?.image
          ? [
              {
                url: profile.user.image,
                width: 400,
                height: 400,
                alt: `${userName}'s profile picture`,
              },
            ]
          : [],
        type: "profile",
      },
      twitter: {
        card: "summary",
        title: `${userName} - Profile`,
        description: shortBio,
        images: profile.user?.image ? [profile.user.image] : [],
      },
    };
  } catch (error) {
    return {
      title: "Profile",
      description: "View user profile",
    };
  }
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { userId } = await params;

  // Create tRPC context and caller
  const heads = new Headers(await headers());
  const ctx = await createTRPCContext({ headers: heads });
  const trpc = createCaller(ctx);

  // Fetch profile data
  const profile = await trpc.profile.getById(userId).catch(() => null);

  if (!profile) {
    notFound();
  }

  // Get user name from the profile's user relation
  const userName = profile.user?.name || "Unknown User";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-6">
            {/* Header with avatar and basic info */}
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <Avatar className="h-24 w-24">
                {profile.user?.image ? (
                  <AvatarImage src={profile.user.image} alt={userName} />
                ) : (
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{userName}</h1>
                {profile.shortBio && (
                  <p className="mt-2 text-muted-foreground">
                    {profile.shortBio}
                  </p>
                )}
                {profile.houseId && (
                  <div className="mt-3">
                    <HouseBadge houseId={profile.houseId} size="md" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile description */}
            {profile.text && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">About</h2>
                <MarkdownContent
                  content={profile.text}
                  id="public-profile-view"
                />
              </div>
            )}

            {/* Gallery */}
            {profile.images && profile.images.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Gallery</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {profile.images.map((image: string, i: number) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <img
                        src={image}
                        alt={`${userName}'s image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="-mx-8 border-t px-8 pt-6">
              <div className="flex justify-center">
                <SendLetterButton receiverId={userId} receiverName={userName} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
