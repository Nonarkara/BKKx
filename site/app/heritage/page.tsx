import type { Metadata } from "next";
import { HeritageMap } from "./HeritageMap";

export const metadata: Metadata = {
  title: "Heritage register",
  description:
    "Every registered ancient monument in Bangkok, mapped from the Fine Arts Department register — and where to stand in the BKKx Minecraft worlds to see each one.",
  alternates: { canonical: "/heritage" },
  openGraph: {
    title: "Bangkok heritage register · BKKx",
    description:
      "571 registered and pending ancient monuments, and the block coordinates that walk you to them.",
    url: "/heritage",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Bangkok heritage register — BKKx",
  description:
    "Fine Arts Department registered ancient monument positions for Bangkok, relocated to building precision and mapped to Minecraft world coordinates.",
  license: "https://creativecommons.org/licenses/by/4.0/",
  isBasedOn: "https://data.go.th/dataset/gis-finearts",
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
};

export default function HeritagePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeritageMap />
    </>
  );
}
