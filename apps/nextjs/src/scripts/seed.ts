import { Buffer } from "node:buffer";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";

import { profilePrompt } from "@acme/api/src/prompts/profile";
import { convertMessageToCoreMessage } from "@acme/api/src/utils/message";
import { auth } from "@acme/auth/auth";
import { db } from "@acme/db/client";
import { message, profile } from "@acme/db/schema";

// Make sure environment variables are loaded
if (!process.env.VOYAGE_API_KEY) {
  throw new Error("VOYAGE_API_KEY is not defined");
}

// Sample user data
const users = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "Password123!",
    conversationData:
      "I'm a software developer with 5 years of experience. I love building web applications and learning new technologies. My favorite frameworks are React and Next.js.",
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    password: "Password123!",
    conversationData:
      "I'm a designer who specializes in UI/UX. I've been working in the industry for 3 years and enjoy creating user-friendly interfaces.",
  },
  {
    name: "Charlie Brown",
    email: "charlie@example.com",
    password: "Password123!",
    conversationData:
      "I'm a product manager with experience in agile methodologies. I enjoy working with development teams to create innovative products.",
  },
  {
    name: "Diana Prince",
    email: "diana@example.com",
    password: "Password123!",
    conversationData:
      "I'm a data scientist with a background in machine learning. I love working with large datasets and extracting meaningful insights.",
  },
];

// Setup Voyage AI client for embeddings
const voyageClient = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

// Function to create a user with Better Auth
async function createUser(userData: (typeof users)[0]) {
  try {
    // Create user with Better Auth
    const user = await auth.api.createUser({
      body: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: "user", // Default role
      },
    });

    console.log(`Created user: ${userData.name} (${user.id})`);
    return user;
  } catch (error) {
    console.error(`Failed to create user ${userData.email}:`, error);
    throw error;
  }
}

// Function to create a chat and messages for a user
async function createUserChat(userId: string, chatData: string) {
  // Create a chat
  const chatId = nanoid();
  await db.insert(message).values([
    {
      id: nanoid(),
      chatId,
      role: "user",
      parts: [{ type: "text", text: chatData }],
      attachments: [],
    },
    {
      id: nanoid(),
      chatId,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Thank you for sharing that information about yourself!",
        },
      ],
      attachments: [],
    },
  ]);

  console.log(`Created chat for user: ${userId}`);
  return chatId;
}

// Function to generate profile and embedding for a user
async function generateProfileForUser(userId: string, chatId: string) {
  try {
    // Get messages for the chat
    const messages = await db.query.message.findMany({
      where: (message, { eq }) => eq(message.chatId, chatId),
      orderBy: (message, { asc }) => asc(message.createdAt),
    });

    // Generate profile using the LLM
    const profileStream = await streamText({
      model: google("gemini-2.0-flash"),
      experimental_telemetry: { isEnabled: true },
      system: profilePrompt,
      messages: convertMessageToCoreMessage(messages),
    });

    const profileText = await profileStream.text;
    console.log(`Generated profile for user ${userId}`);

    // Generate embedding
    const embedding = await voyageClient.embed({
      input: [profileText],
      model: "voyage-3-large",
    });

    const embeddingData = embedding.data?.[0]?.embedding;
    if (!embeddingData) {
      throw new Error("Failed to embed profile text");
    }

    const buffered = Buffer.from(new Float32Array(embeddingData).buffer);

    // Save profile with embedding
    await db.insert(profile).values({
      text: profileText,
      userId: userId,
      embedding: buffered,
    });

    console.log(`Saved profile with embedding for user: ${userId}`);
  } catch (error) {
    console.error(`Failed to generate profile for user ${userId}:`, error);
  }
}

async function main() {
  console.log("Starting database seed...");

  for (const userData of users) {
    try {
      // Create the user
      const user = await createUser(userData);

      // Create a chat with conversation data
      const chatId = await createUserChat(user.id, userData.conversationData);

      // Generate and save profile with embedding
      await generateProfileForUser(user.id, chatId);

      console.log(`Completed setup for user: ${userData.name}\n`);
    } catch (error) {
      console.error(`Failed to complete setup for ${userData.name}`, error);
    }
  }

  console.log("Database seed completed!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
