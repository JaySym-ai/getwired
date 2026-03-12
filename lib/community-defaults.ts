export const DEFAULT_FORUM_CATEGORIES = [
  {
    name: "AI & Machine Learning",
    slug: "ai-ml",
    icon: "Brain",
    color: "#8B5CF6",
    description: "Discuss AI models, ML pipelines, LLMs, and the future of artificial intelligence",
    order: 0,
  },
  {
    name: "Web Development",
    slug: "web-dev",
    icon: "Globe",
    color: "#3B82F6",
    description: "Frontend, backend, full-stack discussions for React, Next.js, Node, and everything web",
    order: 1,
  },
  {
    name: "Mobile Development",
    slug: "mobile",
    icon: "Smartphone",
    color: "#10B981",
    description: "iOS, Android, React Native, Flutter, and cross-platform development",
    order: 2,
  },
  {
    name: "Hardware & IoT",
    slug: "hardware",
    icon: "Cpu",
    color: "#F59E0B",
    description: "Embedded systems, Raspberry Pi, Arduino, robotics, and hardware hacking",
    order: 3,
  },
  {
    name: "Cybersecurity",
    slug: "cybersecurity",
    icon: "ShieldCheck",
    color: "#EF4444",
    description: "Security research, pentesting, CTFs, privacy, and threat analysis",
    order: 4,
  },
  {
    name: "Startups & Business",
    slug: "startups",
    icon: "Rocket",
    color: "#EC4899",
    description: "Founding, funding, scaling, and product lessons from startup teams",
    order: 5,
  },
  {
    name: "Career & Growth",
    slug: "career",
    icon: "TrendingUp",
    color: "#14B8A6",
    description: "Job hunting, interviews, salary negotiation, mentorship, and career advice",
    order: 6,
  },
  {
    name: "Off-Topic & Fun",
    slug: "off-topic",
    icon: "Coffee",
    color: "#6B7280",
    description: "Side projects, tech culture, memes, and everything else",
    order: 7,
  },
] as const;

export const DEFAULT_RSS_FEEDS = [
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
    siteUrl: "https://news.ycombinator.com/",
    categorySlug: "ai-ml",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    siteUrl: "https://www.theverge.com/",
    categorySlug: "web-dev",
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    siteUrl: "https://techcrunch.com/",
    categorySlug: "startups",
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    siteUrl: "https://arstechnica.com/",
    categorySlug: "hardware",
  },
  {
    name: "Wired",
    url: "https://www.wired.com/feed/rss",
    siteUrl: "https://www.wired.com/",
    categorySlug: "ai-ml",
  },
] as const;

export const DEFAULT_CHAT_RETENTION_DAYS = 90;
