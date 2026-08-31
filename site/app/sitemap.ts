import type { MetadataRoute } from "next";
import { worlds } from "./walkthrough-data";
import { AREAS, WALKS } from "./data/heritage-content";
import { REGISTER_SITES } from "./data/heritage-register";
import { CLUSTER_RECORDS } from "./data/shophouse-spine-index";

const siteUrl = "https://bkk.nonarkara.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-09T00:00:00+07:00");

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/worlds`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    // The Editorial register and the research surfaces were never in the
    // sitemap — only the home page, worlds, areas, walks and atlas were.
    ...[
      "/heritage",
      "/rowhouses",
      "/about",
      "/case-for-bangkok",
      "/datasets",
      "/shophouses",
      "/shophouses/atlas",
      "/shophouses/bible",
      "/shophouses/global",
      "/shophouses/research",
    ].map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...AREAS.map((area) => ({
      url: `${siteUrl}/areas/${area.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...WALKS.map((walk) => ({
      url: `${siteUrl}/walks/${walk.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...worlds.map((world) => ({
      url: `${siteUrl}/atlas/${world.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Every register entry is its own page and its own citable URL. Gazetted
    // entries rank above the ones still awaiting a decision, which is the
    // only ordering the register itself supports.
    ...REGISTER_SITES.map((site) => ({
      url: `${siteUrl}/heritage/${site.id}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: site.registered ? 0.7 : 0.6,
    })),
    // Every documented shophouse cluster likewise.
    ...CLUSTER_RECORDS.map((c) => ({
      url: `${siteUrl}/shophouses/cluster/${c.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
