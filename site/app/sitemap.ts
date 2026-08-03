import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bkk.nonarkara.org",
      lastModified: new Date("2026-08-04T00:00:00+07:00"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
