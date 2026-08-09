import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://atlas.nonarkara.org/sitemap.xml",
    host: "https://atlas.nonarkara.org",
  };
}
