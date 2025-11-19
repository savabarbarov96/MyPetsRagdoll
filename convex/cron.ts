import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at midnight to create synthetic visitor boost
crons.daily(
  "create daily synthetic visits",
  { hourUTC: 0, minuteUTC: 0 }, // Midnight UTC
  internal.analytics.createDailySyntheticVisits,
  {} // Empty args object - the function will use today's date by default
);

export default crons;
