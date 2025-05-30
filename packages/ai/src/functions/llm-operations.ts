import type { CoreMessage } from "ai";
import { google } from "@ai-sdk/google";
import { generateObject, generateText, smoothStream, streamText } from "ai";
import { z } from "zod";

// Schema for validation response
export const validationResponseSchema = z.object({
  covered: z.boolean(),
  thoroughness: z.enum(["minimal", "adequate", "detailed"]),
  completionPercentage: z.number().min(0).max(100),
  missingTopics: z.array(z.string()),
  suggestedFollowUpQuestions: z.array(z.string()),
});

// Stream text with smooth streaming
export async function streamSmoothText({
  messages,
  system,
  model = "gemini-2.0-flash",
}: {
  messages?: CoreMessage[];
  system?: string;
  model?: string;
}) {
  return streamText({
    model: google(model),
    messages,
    prompt: system && !messages ? system : undefined,
    system: messages ? system : undefined,
    experimental_telemetry: { isEnabled: true },
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
  });
}

// Generate text without streaming
export async function generateTextResponse({
  prompt,
  messages,
  system,
  model = "gemini-2.0-flash",
}: {
  prompt?: string;
  messages?: CoreMessage[];
  system?: string;
  model?: string;
}) {
  return generateText({
    model: google(model),
    prompt,
    messages,
    system,
    experimental_telemetry: { isEnabled: true },
  });
}

// Generate JSON object with schema validation
export async function generateValidatedObject<T>({
  prompt,
  schema,
  model = "gemini-2.0-flash",
}: {
  prompt: string;
  schema: z.ZodSchema<T>;
  model?: string;
}) {
  return generateObject({
    model: google(model),
    mode: "json",
    schema,
    prompt,
  });
}

// Stream text without smooth streaming (for profile generation)
export async function streamTextResponse({
  prompt,
  messages,
  system,
  model = "gemini-2.0-flash",
}: {
  prompt?: string;
  messages?: CoreMessage[];
  system?: string;
  model?: string;
}) {
  return streamText({
    model: google(model),
    prompt,
    messages,
    system,
    experimental_telemetry: { isEnabled: true },
  });
}
