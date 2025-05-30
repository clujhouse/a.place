import type { TRPCRouterRecord } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import {
  createProfileEmbedding,
  generateTextResponse,
  generateValidatedObject,
  initialGreetingPrompt,
  judgePrompt,
  learnWithRemainingQuestionsEmphasized,
  profilePrompt,
  shortBioPrompt,
  streamSmoothText,
  streamTextResponse,
  validationResponseSchema,
} from "@acme/ai";
import { message, profile } from "@acme/db/schema";

import type { TRPCContext } from "../trpc";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

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

  return await generateValidatedObject({
    prompt: `${judgePrompt}\n\n## Conversation to Analyze:\n${conversationForValidation}`,
    schema: validationResponseSchema,
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
  const result = await streamTextResponse({
    messages: convertMessageToCoreMessage(allMessages),
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

  const conversationContext = convertMessageToCoreMessage(allMessages)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const prompt = `${profilePrompt}${existingProfileContext}\n\n## Conversation Context:\n${conversationContext}`;

  const profileStream = await streamTextResponse({
    prompt,
    model: "gemini-2.5-flash-preview-04-17",
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

  const { text } = await generateTextResponse({
    prompt: `${profilePrompt}${existingProfileContext}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
      allMessages,
    )
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")}`,
    model: "gemini-2.5-flash-preview-04-17",
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

  const { text: shortBioText } = await generateTextResponse({
    prompt: `${shortBioPrompt}${existingProfileContext}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
      allMessages,
    )
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")}`,
    model: "gemini-2.0-flash",
  });

  return shortBioText;
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

      const result = await streamSmoothText({
        system: `${initialGreetingPrompt}

${existingProfileContext}`,
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
