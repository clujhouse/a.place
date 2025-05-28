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
  params: { userId: string };
}) {
  const { userId } = params;

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

    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "24px",
              padding: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: "900px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Profile Avatar */}
            {profile.user?.image && (
              <img
                src={profile.user.image}
                alt={userName}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "60px",
                  objectFit: "cover",
                  border: "4px solid #667eea",
                  marginBottom: "20px",
                }}
              />
            )}

            {/* Name */}
            <div
              style={{
                fontSize: "56px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "16px",
                lineHeight: "1.2",
              }}
            >
              {userName}
            </div>

            {/* Short Bio */}
            {shortBio && (
              <div
                style={{
                  fontSize: "24px",
                  color: "#6b7280",
                  marginBottom: "24px",
                  lineHeight: "1.4",
                  maxWidth: "600px",
                }}
              >
                {shortBio.length > 100
                  ? `${shortBio.slice(0, 100)}...`
                  : shortBio}
              </div>
            )}

            {/* House Badge (if exists) */}
            {profile.houseId && (
              <div
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "18px",
                  fontWeight: "600",
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
