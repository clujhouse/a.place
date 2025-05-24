import type { Duration } from "@upstash/ratelimit";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

import { getAnonUser } from "@acme/validators/redis";

import type { TRPCContext } from "./trpc";

// Create a new ratelimiter, that allows 10 requests per 10 seconds

export const checkLimitsPublic = async (
  ctx: TRPCContext,
  type: string,
  tokens: number,
  duration: Duration,
) => {
  const ip = ctx.ip;

  const isLoggedIn = ctx.session?.user;

  if (isLoggedIn && ctx.session?.user.id)
    return {
      type: "user" as const,
      userId: ctx.session.user.id,
    };

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(tokens, duration),
    analytics: true,
  });

  const { success } = await ratelimit.limit(`${type}:${ip}`);

  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }

  const anonUser = await getAnonUser(ctx.ip);

  return {
    type: "anon" as const,
    anonUser,
  };
};
