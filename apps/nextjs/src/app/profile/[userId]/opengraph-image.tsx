import { headers } from "next/headers";
import { ImageResponse } from "next/og";

import { createCaller, createTRPCContext } from "@acme/api";

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  try {
    // Create tRPC context and caller
    const heads = new Headers(await headers());
    const ctx = await createTRPCContext({ headers: heads });
    const trpc = createCaller(ctx);

    // Fetch profile data
    const profile = await trpc.profile.getById(userId);

    if (!profile) {
      // Fallback image for profile not found
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 48,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontWeight: "bold",
            }}
          >
            Profile Not Found
          </div>
        ),
        {
          ...size,
        },
      );
    }

    const userName = profile.user?.name || "Unknown User";
    const shortBio = profile.shortBio || "";
    const profileImage = profile.user?.image;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Background Image or Gradient */}
          {profileImage ? (
            <img
              src={profileImage}
              alt={userName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          )}

          {/* Dark overlay for better text readability */}
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "rgba(0, 0, 0, 0.4)",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />

          {/* Text Content Overlay */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "60px",
              position: "relative",
              zIndex: 1,
              textAlign: "center",
            }}
          >
            {/* User Name */}
            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "white",
                marginBottom: "20px",
                lineHeight: "1.1",
                textShadow: "0 4px 8px rgba(0, 0, 0, 0.8)",
                maxWidth: "1000px",
              }}
            >
              {userName}
            </div>

            {/* Short Bio */}
            {shortBio && (
              <div
                style={{
                  fontSize: "32px",
                  color: "rgba(255, 255, 255, 0.9)",
                  lineHeight: "1.4",
                  maxWidth: "800px",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
                }}
              >
                {shortBio.length > 120
                  ? `${shortBio.slice(0, 120)}...`
                  : shortBio}
              </div>
            )}

            {/* House Badge (if exists) */}
            {profile.houseId && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#374151",
                  padding: "12px 24px",
                  borderRadius: "25px",
                  fontSize: "24px",
                  fontWeight: "600",
                  marginTop: "30px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                }}
              >
                House Member
              </div>
            )}
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  } catch (error) {
    // Fallback image for errors
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontWeight: "bold",
          }}
        >
          Profile
        </div>
      ),
      {
        ...size,
      },
    );
  }
}
