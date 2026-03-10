import type { Metadata } from "next";
import { MarketplaceClient } from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Boost your posts, advertise your product, and unlock premium features on GetWired.dev.",
  openGraph: {
    title: "Marketplace | GetWired.dev",
    description:
      "Boost your posts, advertise your product, and unlock premium features on GetWired.dev.",
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}

