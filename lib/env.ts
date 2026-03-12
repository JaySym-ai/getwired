const APP_ENVIRONMENTS = ["dev", "prod"] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

function parseAppEnvironment(value: string | undefined): AppEnvironment | null {
  if (value && APP_ENVIRONMENTS.includes(value as AppEnvironment)) {
    return value as AppEnvironment;
  }

  return null;
}

export const APP_ENV =
  parseAppEnvironment(process.env.NEXT_PUBLIC_APP_ENV) ??
  (process.env.NODE_ENV === "production" ? "prod" : "dev");

export const isDevelopment = APP_ENV === "dev";
export const isProduction = APP_ENV === "prod";

export function getRequiredConvexUrl() {
  const value = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!value) {
    throw new Error("Missing required public environment variable: NEXT_PUBLIC_CONVEX_URL");
  }

  return value;
}
