import { NextRequest, NextResponse } from "next/server";

import { auth } from "@acme/auth";
import { db } from "@acme/db/client";
import { application } from "@acme/db/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      cohortId,
      name,
      email,
      social,
      storyDescription,
      projectMetrics,
      image,
      isLocal,
      canAttendAllDays,
    } = body;

    // Validate required fields
    if (
      !cohortId ||
      !name ||
      !email ||
      !storyDescription ||
      !projectMetrics ||
      !isLocal ||
      !canAttendAllDays
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create application
    await db.insert(application).values({
      cohortId,
      userId: session.user.id,
      name: name.trim(),
      email: email.trim(),
      social: social?.trim() || null,
      storyDescription: storyDescription.trim(),
      projectMetrics: projectMetrics.trim(),
      image: image || null,
      isLocal,
      canAttendAllDays,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Submit application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
