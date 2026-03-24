import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily: re-analyze tracked keywords
crons.daily(
  "daily-keyword-analysis",
  { hourUTC: 6, minuteUTC: 0 },
  internal.analysis.analyzeAllTrackedKeywords
);

// Every 4 hours: scan Reddit for new posts
crons.interval("reddit-scan", { hours: 4 }, internal.reddit.scanAllProjects);

// Weekly: generate digest
crons.weekly(
  "weekly-digest",
  { dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 },
  internal.monitoring.generateWeeklyDigest
);

export default crons;

