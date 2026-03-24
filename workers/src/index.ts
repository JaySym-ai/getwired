import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config";
import { authMiddleware } from "./middleware/auth";
import { healthRoute } from "./routes/health";
import { keywordMetricsRoute } from "./routes/keyword-metrics";
import { competitorsRoute } from "./routes/competitors";
import { trendsRoute } from "./routes/trends";
import { closeBrowser } from "./scrapers/browser";

const app = Fastify({
  logger: true,
});

async function start() {
  // Register CORS
  await app.register(cors, { origin: true });

  // Auth middleware for /api routes
  app.addHook("onRequest", authMiddleware);

  // Register routes
  await app.register(healthRoute);
  await app.register(keywordMetricsRoute);
  await app.register(competitorsRoute);
  await app.register(trendsRoute);

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info("Shutting down...");
    await closeBrowser();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Start server
  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(
    `Worker ${config.nodeId} listening on port ${config.port}`
  );
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

