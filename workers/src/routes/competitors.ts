import { FastifyInstance } from "fastify";
import { extractSiteKeywords } from "../scrapers/site-keywords";
import { scrapeGoogleSerp } from "../scrapers/google-serp";
import { config } from "../config";
import { randomDelay } from "../utils/retry";

interface CompetitorsBody {
  domain: string;
}

export async function competitorsRoute(app: FastifyInstance) {
  app.post<{ Body: CompetitorsBody }>(
    "/api/v1/competitors",
    async (request, reply) => {
      const { domain } = request.body;

      if (!domain) {
        return reply.status(400).send({ error: "domain is required" });
      }

      try {
        // Step 1: Extract seed keywords from the domain
        const seedKeywords = await extractSiteKeywords(domain);
        const keywords = seedKeywords.slice(0, config.maxSeedKeywords);

        if (keywords.length === 0) {
          return { competitors: [] };
        }

        // Step 2: Scrape SERP for each keyword and collect domain appearances
        const domainCounts = new Map<string, number>();
        let searchedCount = 0;

        for (const keyword of keywords) {
          try {
            const serpResults = await scrapeGoogleSerp(keyword);

            for (const result of serpResults) {
              try {
                const url = new URL(result.url);
                const resultDomain = url.hostname.replace(/^www\./, "");

                // Skip the input domain and generic domains
                if (resultDomain === domain.replace(/^www\./, "")) continue;
                if (
                  config.genericDomains.some(
                    (gd) =>
                      resultDomain === gd ||
                      resultDomain.endsWith(`.${gd}`)
                  )
                )
                  continue;

                domainCounts.set(
                  resultDomain,
                  (domainCounts.get(resultDomain) || 0) + 1
                );
              } catch {
                // Invalid URL, skip
              }
            }

            searchedCount++;
            // Rate limit between SERP requests
            if (searchedCount < keywords.length) {
              await randomDelay();
            }
          } catch (error) {
            request.log.warn(
              { keyword, error },
              "SERP scrape failed for keyword"
            );
          }
        }

        // Step 3: Score and rank competitors by overlap
        const competitors = Array.from(domainCounts.entries())
          .map(([compDomain, count]) => ({
            domain: compDomain,
            name: compDomain,
            overlapScore: Math.round((count / searchedCount) * 100),
          }))
          .sort((a, b) => b.overlapScore - a.overlapScore)
          .slice(0, config.maxCompetitorResults);

        return { competitors };
      } catch (error) {
        request.log.error(error, "Competitor discovery failed");
        return reply.status(500).send({ error: "Competitor discovery failed" });
      }
    }
  );
}

