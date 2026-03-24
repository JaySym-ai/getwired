import { FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip auth for health check
  if (request.url === "/api/v1/health") {
    return;
  }

  // Skip auth for non-API routes
  if (!request.url.startsWith("/api/")) {
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);
  if (token !== config.workerApiKey) {
    return reply.status(403).send({ error: "Invalid API key" });
  }
}

