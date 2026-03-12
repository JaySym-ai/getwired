const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!clerkIssuerDomain) {
  throw new Error("Missing CLERK_JWT_ISSUER_DOMAIN for Convex auth.");
}

const authConfig = {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
