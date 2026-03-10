import { NextResponse } from "next/server";

export function GET() {
  const manifest = {
    name: "GetWired.dev — Tech Community",
    short_name: "GetWired",
    description:
      "The all-in-one tech community platform. Forums, chat, news, profiles, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#00FF41",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["social", "news", "developer tools"],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}

