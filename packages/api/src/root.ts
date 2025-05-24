import { chatRouter } from "./router/chat";
import { conversationRouter } from "./router/conversation";
import { llmRouter } from "./router/llm";
import { mainRouter } from "./router/main";
import { profileRouter } from "./router/profile";
import { similarProfilesRouter } from "./router/similar-profiles";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  llm: llmRouter,
  profile: profileRouter,
  main: mainRouter,
  chat: chatRouter,
  similarProfiles: similarProfilesRouter,
  conversation: conversationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
