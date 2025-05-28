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

export const checkSearchLimits = async (ctx: TRPCContext) => {
  // If user is not logged in, they can't search
  if (!ctx.session?.user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to search",
    });
  }

  const userId = ctx.session.user.id;
  const stripeCustomerId = ctx.session.user.stripeCustomerId;

  // Check if user has an active subscription
  let activeSubscription = null;
  if (stripeCustomerId) {
    activeSubscription = await ctx.db.query.subscription.findFirst({
      where: (subscription, { eq, and }) =>
        and(
          eq(subscription.stripeCustomerId, stripeCustomerId),
          eq(subscription.status, "active"),
        ),
    });
  }

  // If user has an active subscription, no limits
  if (activeSubscription) {
    return {
      type: "premium" as const,
      userId,
      plan: activeSubscription.plan,
    };
  }

  // For free users, limit to 5 searches per day
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(7, "1 d"), // 5 requests per day
    analytics: true,
  });

  const { success, limit, remaining, reset } = await ratelimit.limit(
    `search:${userId}`,
  );

  if (!success) {
    const resetTime = new Date(reset).toLocaleString();
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `You've reached your daily search limit of ${limit} searches. Your limit will reset at ${resetTime}. Upgrade to a paid plan for unlimited searches.`,
    });
  }

  return {
    type: "free" as const,
    userId,
    remaining,
    limit,
    reset,
  };
};
