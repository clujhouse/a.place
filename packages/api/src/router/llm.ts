import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateObject, generateText, smoothStream, streamText } from "ai";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { message, profile } from "@acme/db/schema";

import type { TRPCContext } from "../trpc";
import { initialGreetingPrompt } from "../prompts/initial-greeting";
import { judgePrompt } from "../prompts/judge-prompt";
import { learnWithRemainingQuestionsEmphasized } from "../prompts/learn-about-you";
import { profilePrompt, shortBioPrompt } from "../prompts/profile";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

const validationResponseSchema = z.object({
  covered: z.boolean(),
  thoroughness: z.enum(["minimal", "adequate", "detailed"]),
  completionPercentage: z.number().min(0).max(100),
  missingTopics: z.array(z.string()),
  suggestedFollowUpQuestions: z.array(z.string()),
});

async function createUserMessage(
  ctx: TRPCContext & { session: { user: { id: string } } },
  chatId: string,
  input: string,
  lastMessages: AMessage[],
) {
  const userMessage = {
    id: nanoid(),
    role: "user" as const,
    chatId: chatId,
    attachments: [],
    parts: [{ id: nanoid(), type: "text", text: input }],
  };

  const userMessageId = await ctx.db
    .insert(message)
    .values(userMessage)
    .$returningId();

  const allMessages = [
    ...lastMessages,
    { ...userMessage, id: userMessageId },
  ] as AMessage[];

  return allMessages;
}

async function runValidationIfNeeded(
  profileData: any,
  allMessages: AMessage[],
) {
  const conversationForValidation = allMessages
    .map(
      (msg) =>
        `${msg.role}: ${msg.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join(" ")}`,
    )
    .join("\n");

  return await generateObject({
    model: google("gemini-2.0-flash"),
    mode: "json",
    schema: validationResponseSchema,
    prompt: `${judgePrompt}\n\n## Conversation to Analyze:\n${conversationForValidation}`,
  });
}

async function* generateAIResponse(
  ctx: TRPCContext & { session: { user: { id: string } } },
  allMessages: AMessage[],
  chatId: string,
  suggestedFollowUpQuestions: string[],
) {
  const customPrompt = learnWithRemainingQuestionsEmphasized(
    suggestedFollowUpQuestions,
  );
  const aiMessageId = nanoid();
  const result = streamText({
    model: google("gemini-2.0-flash"),
    messages: convertMessageToCoreMessage(allMessages),
    experimental_telemetry: { isEnabled: true },
    system: customPrompt,
  });

  yield {
    type: "learnAboutYou" as const,
    chunk: { type: "messageId" as const, id: aiMessageId },
  };

  const learnAboutYouPartId = nanoid();
  for await (const chunk of result.textStream) {
    yield {
      type: "learnAboutYou" as const,
      chunk: {
        id: learnAboutYouPartId,
        type: "text" as const,
        text: chunk,
      },
    };
  }

  const responseText = await result.text;

  await ctx.db.insert(message).values({
    id: aiMessageId,
    role: "assistant",
    parts: [{ id: learnAboutYouPartId, type: "text", text: responseText }],
    chatId: chatId,
    attachments: [],
  });

  return responseText;
}

async function* streamProfileContent(
  allMessages: AMessage[],
  existingProfile?: string | null,
) {
  const existingProfileContext = existingProfile
    ? `\n\n## Existing Profile:\n${existingProfile}\n\n## Short Bio:\n${existingProfile || "none yet"}`
    : "\n\n## Existing Profile:\nnone yet - this is their first profile";

  const profileStream = streamText({
    model: google("gemini-2.5-flash-preview-04-17"),
    experimental_telemetry: { isEnabled: true },
    prompt: `${profilePrompt}${existingProfileContext}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
      allMessages,
    )
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")}`,
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
  });

  for await (const chunk of profileStream.fullStream) {
    if (chunk.type === "text-delta") {
      yield {
        type: "profile" as const,
        chunk: chunk,
      };
    }
  }

  return await profileStream.text;
}

async function generateProfileText(
  allMessages: AMessage[],
  existingProfile?: string | null,
) {
  const existingProfileContext = existingProfile
    ? `\n\n## Existing Profile:\n${existingProfile}\n\n## Short Bio:\n${existingProfile || "none yet"}`
    : "\n\n## Existing Profile:\nnone yet - this is their first profile";

  const { text } = await generateText({
    model: google("gemini-2.5-flash-preview-04-17"),
    experimental_telemetry: { isEnabled: true },
    prompt: `${profilePrompt}${existingProfileContext}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
      allMessages,
    )
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")}`,
  });

  return text;
}

async function generateShortBio(
  allMessages: AMessage[],
  existingProfile?: string | null,
) {
  const existingProfileContext = existingProfile
    ? `\n\n## Existing Short Bio:\n${existingProfile}`
    : "\n\n## Existing Short Bio:\nnone yet - this is their first bio";

  const { text: shortBioText } = await generateText({
    model: google("gemini-2.0-flash"),
    experimental_telemetry: { isEnabled: true },
    prompt: `${shortBioPrompt}${existingProfileContext}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
      allMessages,
    )
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")}`,
  });

  return shortBioText;
}

async function createProfileEmbedding(profileText: string) {
  const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  const embedding = await client.embed({
    input: [profileText],
    model: "voyage-3-large",
  });

  const embeddingData = embedding.data?.[0]?.embedding;
  if (!embeddingData) {
    throw new Error("Failed to embed profile text");
  }

  return Buffer.from(new Float32Array(embeddingData).buffer);
}

async function updateProfile(
  ctx: TRPCContext & { session: { user: { id: string } } },
  profileText: string,
  shortBioText: string,
  embeddingBuffer: Buffer,
  completionPercentage: number,
) {
  await ctx.db
    .insert(profile)
    .values({
      text: profileText,
      shortBio: shortBioText,
      userId: ctx.session.user.id,
      embedding: embeddingBuffer,
    })
    .onDuplicateKeyUpdate({
      set: {
        text: profileText,
        shortBio: shortBioText,
        embedding: embeddingBuffer,
        completionPercentage: completionPercentage,
      },
    });
}

export const llmRouter = {
  getInitialMessage: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async function* ({ ctx, input: { chatId } }) {
      // Generate AI greeting without creating any messages or updating profile
      const aiMessageId = nanoid();

      const profileData = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      const existingProfileContext = profileData?.text
        ? `\n\n## Existing Profile:\n${profileData.text}\n\n## Short Bio:\n${profileData.shortBio}`
        : "\n\n## Existing Profile:\nnone yet - this is their first profile";

      yield {
        type: "learnAboutYou" as const,
        chunk: { type: "messageId" as const, id: aiMessageId },
      };

      const textPartId = nanoid();
      let assistantText = "";

      const result = streamText({
        model: google("gemini-2.0-flash"),
        experimental_telemetry: { isEnabled: true },
        prompt: `${initialGreetingPrompt}

${existingProfileContext}`,
        experimental_transform: smoothStream({
          delayInMs: 20,
          chunking: "word",
        }),
      });

      for await (const chunk of result.textStream) {
        assistantText += chunk;
        yield {
          type: "learnAboutYou" as const,
          chunk: {
            id: textPartId,
            type: "text" as const,
            text: chunk,
          },
        };
      }

      // Save the assistant message to the database
      await ctx.db.insert(message).values({
        id: aiMessageId,
        role: "assistant",
        parts: [{ id: textPartId, type: "text", text: assistantText }],
        chatId: chatId,
        attachments: [],
      });
    }),

  learnAboutYou: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        input: z.string(),
      }),
    )
    .mutation(async function* ({ ctx, input: { chatId, input } }) {
      // Get all messages from the chat with their full content
      const lastMessages = await ctx.db.query.message.findMany({
        where: (message, { eq }) => eq(message.chatId, chatId),
        orderBy: (message, { asc }) => asc(message.createdAt),
      });

      const profileData = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      const allMessages = await createUserMessage(
        ctx,
        chatId,
        input,
        lastMessages as AMessage[],
      );

      const validation = await runValidationIfNeeded(profileData, allMessages);

      // Generate AI response
      for await (const chunk of generateAIResponse(
        ctx,
        allMessages,
        chatId,
        validation.object.suggestedFollowUpQuestions,
      )) {
        yield chunk;
      }

      // Stream profile content
      for await (const chunk of streamProfileContent(
        allMessages,
        profileData?.text,
      )) {
        yield chunk;
      }

      // Calculate new completion percentage by adding incremental to existing
      const existingCompletionPercentage =
        profileData?.completionPercentage ?? 0;
      const incrementalPercentage = validation.object.completionPercentage;
      const newCompletionPercentage = Math.min(
        100,
        existingCompletionPercentage + incrementalPercentage,
      );

      if (
        newCompletionPercentage >= 100 &&
        existingCompletionPercentage < 100
      ) {
        yield {
          type: "confetti" as const,
        };
      }

      yield {
        type: "completionPercentage" as const,
        validation: newCompletionPercentage,
      };

      // Generate profile content for saving
      const profileText = await generateProfileText(
        allMessages,
        profileData?.text,
      );
      const shortBioText = await generateShortBio(
        allMessages,
        profileData?.text,
      );

      const embeddedProfileText = `
name: ${ctx.session.user.name}

one liner
${shortBioText}

${profileText}
      
`;
      const embeddingBuffer = await createProfileEmbedding(embeddedProfileText);

      await updateProfile(
        ctx,
        profileText,
        shortBioText,
        embeddingBuffer,
        newCompletionPercentage,
      );
    }),
} satisfies TRPCRouterRecord;
