export const config = {
  port: parseInt(process.env.PORT || "3100", 10),
  nodeId: process.env.NODE_ID || "vps-1",
  workerApiKey: process.env.WORKER_API_KEY || "",

  // Rate limiting
  maxSerpRequestsPerMinute: parseInt(
    process.env.MAX_SERP_REQUESTS_PER_MINUTE || "6",
    10
  ),
  requestDelayMinMs: parseInt(process.env.REQUEST_DELAY_MIN_MS || "3000", 10),
  requestDelayMaxMs: parseInt(process.env.REQUEST_DELAY_MAX_MS || "8000", 10),

  // Timeouts
  keywordMetricsTimeoutMs: 60_000,
  trendsTimeoutMs: 60_000,
  competitorsTimeoutMs: 180_000,

  // Competitor discovery
  maxSeedKeywords: 15,
  maxCompetitorResults: 10,

  // Generic domains to filter out from competitor results
  genericDomains: [
    "wikipedia.org",
    "youtube.com",
    "reddit.com",
    "medium.com",
    "twitter.com",
    "x.com",
    "facebook.com",
    "linkedin.com",
    "instagram.com",
    "pinterest.com",
    "amazon.com",
    "ebay.com",
    "quora.com",
    "yelp.com",
    "apple.com",
    "google.com",
    "microsoft.com",
    "github.com",
    "stackoverflow.com",
    "w3schools.com",
  ],
};

