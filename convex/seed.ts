import { internalMutation } from "./_generated/server";

export const seedDemoData = internalMutation({
  args: {},
  handler: async () => {
    return {
      ok: false,
      message: "Demo seeding has been disabled. The app now uses live Convex-backed data only.",
    };
  },
});
