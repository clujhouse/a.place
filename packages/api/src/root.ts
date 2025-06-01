import { chatRouter } from "./router/chat";
import { conversationRouter } from "./router/conversation";
import { houseRouter } from "./router/house";
import { llmRouter } from "./router/llm";
import { mainRouter } from "./router/main";
import { onboardingRouter } from "./router/onboarding";
import { profileRouter } from "./router/profile";
import { profileNoteRouter } from "./router/profile-note";
import { similarProfilesRouter } from "./router/similar-profiles";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  llm: llmRouter,
  profile: profileRouter,
  main: mainRouter,
  chat: chatRouter,
  house: houseRouter,
  similarProfiles: similarProfilesRouter,
  conversation: conversationRouter,
  profileNote: profileNoteRouter,
  onboarding: onboardingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
