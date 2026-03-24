import { FastifyInstance } from "fastify";
import { config } from "../config";

const startTime = Date.now();

export async function healthRoute(app: FastifyInstance) {
  app.get("/api/v1/health", async () => {
    return {
      status: "ok",
      node: config.nodeId,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  });
}

