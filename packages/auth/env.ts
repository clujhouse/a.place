import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),

    BETTER_AUTH_URL: z.string().min(1),

    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production"]).optional(),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    // STRIPE_WEBHOOK_SECRET:
    //   process.env.NODE_ENV === "production"
    //     ? z.string().min(1)
    //     : z.string().min(1).optional(),
    PRO_PRODUCT_PRICE_ID: z.string().min(1),
    ULTIMATE_PRODUCT_PRICE_ID: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
