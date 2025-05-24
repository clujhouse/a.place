import { Buffer } from "node:buffer";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";

import { auth } from "@acme/auth";
import { db } from "@acme/db/client";
import { account, chat, message, profile, user } from "@acme/db/schema";

import { profilePrompt } from "../prompts/profile";
import { convertMessageToCoreMessage } from "../utils/message";

// Make sure environment variables are loaded
if (!process.env.VOYAGE_API_KEY) {
  throw new Error("VOYAGE_API_KEY is not defined");
}

// Interface for user profile data
interface UserProfile {
  name: string;
  email: string;
  password: string;
  conversationData: string;
}

// Setup Voyage AI client for embeddings
const voyageClient = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

// Generate user profiles using AI
async function generateUserProfiles(count: number): Promise<UserProfile[]> {
  const userPrompt = `Generate ${count} unique fictional user profiles for a seed database. 
  Each profile should include:
  - Full name
  - Email address (use example.com domain)
  - A short paragraph (2-3 sentences) about their background, interests, and skills
  
  Format the output as a JavaScript array of objects with the following structure:
  [
    {
      "name": "Full Name",
      "email": "email@example.com",
      "conversationData": "Background and interests information..."
    },
    ...
  ]
  
  Make the profiles diverse in terms of backgrounds, interests, and skills.`;

  const result = await streamText({
    model: google("gemini-2.0-flash"),
    experimental_telemetry: { isEnabled: true },
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText = await result.text;

  try {
    // Extract the JSON array from the response
    const jsonMatch = /\[\s*\{.*\}\s*\]/s.exec(responseText);
    if (!jsonMatch) throw new Error("Couldn't extract JSON from AI response");

    // Parse the JSON
    const profiles = JSON.parse(jsonMatch[0]);
    console.log(`Generated ${profiles.length} user profiles with AI`);

    return profiles.map((p: any) => ({
      ...p,
      password: "Password123!", // Add default password
    }));
  } catch (error) {
    console.error("Failed to parse AI-generated profiles:", error);
    // Fallback to predefined users
    return [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "Password123!",
        conversationData:
          "I'm a software developer with 5 years of experience. I love building web applications and learning new technologies.",
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        password: "Password123!",
        conversationData:
          "I'm a designer specializing in UI/UX. I've been in the industry for 3 years and enjoy creating user-friendly interfaces.",
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
  }
}

// Function to create a user with Better Auth
async function createUser(userData: UserProfile) {
  try {
    // Create user directly in the database
    const userId = nanoid();
    const now = new Date();

    await db.transaction(async (tx) => {
      // Insert the user record directly
      await tx.insert(user).values({
        id: userId,
        name: userData.name,
        email: userData.email,
        emailVerified: true, // Setting to true since this is a seed user
        image: null,
        createdAt: now,
        updatedAt: now,
      });

      // Create account record with password
      await tx.insert(account).values({
        id: nanoid(),
        userId: userId,
        providerId: "credentials",
        accountId: userData.email,
        password: userData.password, // Would be hashed in a real auth flow
        createdAt: now,
        updatedAt: now,
      });
    });

    console.log(`Created user: ${userData.name} (${userId})`);
    return { id: userId, conversationData: userData.conversationData };
  } catch (error) {
    console.error(`Failed to create user ${userData.email}:`, error);
    throw error;
  }
}

// Function to create a chat and messages for a user
async function createUserChat(userId: string, chatData: string) {
  try {
    // Create a chat
    const chatId = nanoid();

    // Insert chat record
    await db.insert(chat).values({
      id: chatId,
      title: "Introduction",
      userId: userId,
      visibility: "private",
    });

    // Create messages with proper types
    interface MessagePart {
      type: "text";
      text: string;
    }

    const userMessage = {
      id: nanoid(),
      chatId,
      role: "user" as const,
      parts: [{ type: "text", text: chatData }] as MessagePart[],
      attachments: [],
    };

    const assistantMessage = {
      id: nanoid(),
      chatId,
      role: "assistant" as const,
      parts: [
        {
          type: "text",
          text: "Thank you for sharing that information about yourself!",
        },
      ] as MessagePart[],
      attachments: [],
    };

    // Insert messages
    await db.insert(message).values([userMessage, assistantMessage]);

    console.log(`Created chat for user: ${userId}`);
    return chatId;
  } catch (error) {
    console.error(`Failed to create chat for user ${userId}:`, error);
    throw error;
  }
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
      completionPercentage: 100, // Mark as complete
    });

    console.log(`Saved profile with embedding for user: ${userId}`);
  } catch (error) {
    console.error(`Failed to generate profile for user ${userId}:`, error);
  }
}

// Process a single user
async function processUser(userData: UserProfile) {
  try {
    // Create the user
    const user = await createUser(userData);

    // Create a chat with conversation data
    const chatId = await createUserChat(user.id, userData.conversationData);

    // Generate and save profile with embedding
    await generateProfileForUser(user.id, chatId);

    console.log(`Completed setup for user: ${userData.name}\n`);
    return true;
  } catch (error) {
    console.error(`Failed to complete setup for ${userData.name}`, error);
    return false;
  }
}

async function main() {
  console.log("Starting database seed...");

  try {
    // Generate user profiles with AI
    const userProfiles = await generateUserProfiles(10);

    // Process users in parallel with a limit of 3 at a time to avoid rate limits
    const results: PromiseSettledResult<boolean>[] = [];
    const batchSize = 3;

    for (let i = 0; i < userProfiles.length; i += batchSize) {
      const batch = userProfiles.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(processUser));
      results.push(...batchResults);
    }

    // Count successful and failed users
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value,
    ).length;
    const failed = results.length - successful;

    console.log(
      `Database seed completed! Created ${successful} users successfully (${failed} failed)`,
    );
  } catch (error) {
    console.error("Seed process failed:", error);
  }

  process.exit(0);
}

// Run the main function if this script is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error in seed script:", error);
    process.exit(1);
  });
}

// Export for testing or programmatic use
export { main, generateUserProfiles };
