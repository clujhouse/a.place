import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@acme/db/client";
import { application, cohortMember } from "@acme/db/schema";

export async function POST(request: Request) {
  try {
    const { applicationId, status } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "applicationId and status are required" },
        { status: 400 },
      );
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be pending, approved, or rejected" },
        { status: 400 },
      );
    }

    // Update application status
    await db
      .update(application)
      .set({ status })
      .where(eq(application.id, applicationId));

    // If approved, also create a cohort member
    if (status === "approved") {
      const app = await db.query.application.findFirst({
        where: eq(application.id, applicationId),
      });

      if (app) {
        // Check if cohort member already exists
        const existingMember = await db.query.cohortMember.findFirst({
          where: (cohortMember, { and, eq }) =>
            and(
              eq(cohortMember.cohortId, app.cohortId),
              eq(cohortMember.userId, app.userId),
            ),
        });

        if (!existingMember) {
          await db.insert(cohortMember).values({
            cohortId: app.cohortId,
            userId: app.userId,
            status: "accepted",
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      {
        error: "Failed to update application status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
