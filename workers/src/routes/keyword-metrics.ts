import { FastifyInstance } from "fastify";
import { scrapeGoogleSerp } from "../scrapers/google-serp";
import { fetchAutocompleteData } from "../scrapers/google-autocomplete";
import { estimateSearchVolume } from "../estimators/search-volume";
import { estimateDifficulty } from "../estimators/difficulty";
import { config } from "../config";

interface KeywordMetricsBody {
  keyword: string;
  language?: string;
  location?: string;
}

export async function keywordMetricsRoute(app: FastifyInstance) {
  app.post<{ Body: KeywordMetricsBody }>(
    "/api/v1/keyword-metrics",
    async (request, reply) => {
      const { keyword, language = "en", location = "US" } = request.body;

      if (!keyword) {
        return reply.status(400).send({ error: "keyword is required" });
      }

      const timeout = AbortSignal.timeout(config.keywordMetricsTimeoutMs);

      try {
        // Fetch autocomplete data and SERP results in parallel
        const [autocompleteData, serpResults] = await Promise.all([
          fetchAutocompleteData(keyword),
          scrapeGoogleSerp(keyword, { language, location }),
        ]);

        if (timeout.aborted) {
          return reply.status(504).send({ error: "Request timed out" });
        }

        const searchVolume = estimateSearchVolume(
          keyword,
          autocompleteData,
          serpResults
        );
        const keywordDifficulty = estimateDifficulty(serpResults);

        return {
          search_volume: searchVolume,
          keyword_difficulty: keywordDifficulty,
          source: "estimated",
        };
      } catch (error) {
        request.log.error(error, "Keyword metrics scraping failed");
        return reply.status(500).send({ error: "Scraping failed" });
      }
    }
  );
}

