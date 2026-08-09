import type { MetadataRoute } from "next";
import { worlds } from "./walkthrough-data";

const siteUrl = "https://atlas.nonarkara.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-09T00:00:00+07:00");

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...worlds.map((world) => ({
      url: `${siteUrl}/atlas/${world.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
