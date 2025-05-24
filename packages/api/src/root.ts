import { chatRouter } from "./router/chat";
import { llmRouter } from "./router/llm";
import { mainRouter } from "./router/main";
import { profileRouter } from "./router/profile";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  llm: llmRouter,
  profile: profileRouter,
  main: mainRouter,
  chat: chatRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
