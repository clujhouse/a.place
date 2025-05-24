import { Redis } from "@upstash/redis";
import humanId from "human-id";

import type { Plan } from "./plans";
import {
  getEndOfMonthDuration,
  getImportLimitKey,
  getUploadSizeLimit,
  getUploadSizeLimitKey,
} from "./limits";

const redis = Redis.fromEnv();

export const checkUploadLimit = async (
  plan: Plan,
  organizationId: string,
  sizeInMB: number,
) => {
  const uploadSizeKey = getUploadSizeLimitKey(organizationId);
  const importCountKey = getImportLimitKey(organizationId);

  const limits = getUploadSizeLimit(plan);

  const uploadSize = await redis.incrby(uploadSizeKey, sizeInMB);
  const importCount = await redis.incrby(importCountKey, 1);

  const endOfMonth = getEndOfMonthDuration();

  if (importCount === 1 && uploadSize) {
    await redis.expire(uploadSizeKey, endOfMonth);
    await redis.expire(importCountKey, endOfMonth);
  }

  //allow 100MB more than the limit for the upload
  if (uploadSize > limits + 100) return true;

  return false;
};

export const generateAnonUser = async (ip: string) => {
  const name = humanId({
    separator: "-",
    capitalize: false,
  });

  await redis.set(`anon:${ip}`, name);

  return name;
};

export const getAnonUser = async (ip: string) => {
  const name = await redis.get<string>(`anon:${ip}`);

  if (!name) {
    const generatedUser = await generateAnonUser(ip);
    return { name: generatedUser };
  }

  return { name };
};
