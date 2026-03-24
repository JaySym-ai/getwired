import { config } from "../config";

/**
 * Simple sliding-window rate limiter for Google SERP requests.
 * Enforces max N requests per minute per worker node.
 */
class RateLimiter {
  private timestamps: number[] = [];
  private maxPerMinute: number;
  private coolingDown = false;
  private cooldownUntil = 0;

  constructor(maxPerMinute: number) {
    this.maxPerMinute = maxPerMinute;
  }

  /**
   * Acquire permission to make a request.
   * Blocks (via delay) if rate limit would be exceeded.
   */
  async acquire(): Promise<void> {
    // Check if node is in cooldown (CAPTCHA/429 backoff)
    if (this.coolingDown && Date.now() < this.cooldownUntil) {
      const waitMs = this.cooldownUntil - Date.now();
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.coolingDown = false;
    }

    // Clean old timestamps (older than 1 minute)
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < 60_000);

    // If at limit, wait until the oldest request expires
    if (this.timestamps.length >= this.maxPerMinute) {
      const oldestTs = this.timestamps[0];
      const waitMs = 60_000 - (now - oldestTs) + 100; // +100ms buffer
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.timestamps = this.timestamps.filter((t) => Date.now() - t < 60_000);
    }

    this.timestamps.push(Date.now());

    // Add random delay between requests
    const delay =
      config.requestDelayMinMs +
      Math.random() * (config.requestDelayMaxMs - config.requestDelayMinMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Enter cooldown mode (e.g., after CAPTCHA or 429 response).
   * Node pauses for the specified duration.
   */
  enterCooldown(durationMs: number = 5 * 60_000): void {
    this.coolingDown = true;
    this.cooldownUntil = Date.now() + durationMs;
  }

  /**
   * Check if the node is currently in cooldown.
   */
  isCoolingDown(): boolean {
    return this.coolingDown && Date.now() < this.cooldownUntil;
  }
}

export const rateLimiter = new RateLimiter(config.maxSerpRequestsPerMinute);

