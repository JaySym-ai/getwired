import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("ensure default community data", { hours: 1 }, internal.bootstrap.ensureDefaultsInternal, {});
crons.interval("refresh rss feeds", { minutes: 30 }, internal.news.refreshAllFeeds, {});
crons.daily(
  "cleanup old chat messages",
  { hourUTC: 3, minuteUTC: 15 },
  internal.chat.cleanupExpiredMessages,
  {},
);

export default crons;
