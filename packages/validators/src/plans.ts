export const plans = [
  {
    name: "pro", // the name of the plan, it'll be automatically lower cased when stored in the database
    lookupKey: "pro_monthly",
    //TODO handle limits from stripe for each plan, sounds better
  },
  {
    name: "team",
    lookupKey: "team_monthly",
    //TODO handle limits from stripe for each plan, sounds better
  },
] as const;

export type Plan = (typeof plans)[number]["name"];
