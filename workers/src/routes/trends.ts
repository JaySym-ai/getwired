import { FastifyInstance } from "fastify";
import { scrapeGoogleTrends } from "../scrapers/google-trends";
import { config } from "../config";

interface TrendsBody {
  keyword: string;
}

export async function trendsRoute(app: FastifyInstance) {
  app.post<{ Body: TrendsBody }>(
    "/api/v1/trends",
    async (request, reply) => {
      const { keyword } = request.body;

      if (!keyword) {
        return reply.status(400).send({ error: "keyword is required" });
      }

      try {
        const trendData = await scrapeGoogleTrends(keyword);

        // Determine trend direction using same logic as previous SerpApi integration
        let trendDirection: "rising" | "stable" | "declining" = "stable";
        if (trendData.dataPoints.length >= 2) {
          const recent = trendData.dataPoints[trendData.dataPoints.length - 1];
          const older =
            trendData.dataPoints[Math.floor(trendData.dataPoints.length / 2)];
          trendDirection =
            recent > older * 1.1
              ? "rising"
              : recent < older * 0.9
                ? "declining"
                : "stable";
        }

        return {
          trend_direction: trendDirection,
          data_points: trendData.dataPoints,
        };
      } catch (error) {
        request.log.error(error, "Trends scraping failed");
        return reply.status(500).send({ error: "Trends scraping failed" });
      }
    }
  );
}

