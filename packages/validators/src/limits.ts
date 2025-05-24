import { differenceInSeconds, endOfDay, endOfMonth } from "date-fns";
import { match } from "ts-pattern";

type Plan = "free" | "pro" | "team";

//upload limit in MB
export const getUploadSizeLimit = (plan: Plan) =>
  match(plan)
    .with("free", () => 500)
    .with("pro", () => 30 * 1024) // 30 GB in MB
    .with("team", () => 60 * 1024) // 60 GB in MB
    .exhaustive();

export const getImportLimit = (plan: Plan) =>
  match(plan)
    .with("free", () => 3)
    .with("pro", () => 100)
    .with("team", () => 300)
    .exhaustive();

export const getUploadSizeLimitKey = (userId: string) =>
  `organization:${userId}:uploadSize`;

export const getImportLimitKey = (userId: string) =>
  `organization:${userId}:import`;

export const getEndOfMonthDuration = () => {
  const now = new Date();
  const endOfCurrentMonth = endOfMonth(now);

  // Calculate the difference in seconds between now and the end of the month
  const expiryTime = differenceInSeconds(endOfCurrentMonth, now);
  return expiryTime;
};

export const getEndOfDayDuration = () => {
  const now = new Date();
  const endOfCurrentDay = endOfDay(now);

  // Calculate the difference in seconds between now and the end of the day
  const expiryTime = differenceInSeconds(endOfCurrentDay, now);
  return expiryTime;
};
