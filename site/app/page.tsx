import type { Metadata } from "next";
import { AREAS } from "./data/heritage-content";
import { HomepageClient } from "./heritage-atlas/HomepageClient";

export const metadata: Metadata = {
  title: "Kuala Lumpur's heritage, monument by monument",
  description:
    "An open 3D atlas of Kuala Lumpur: nine quarters from Dataran Merdeka to Thean Hou, a National Heritage register mapped honestly, and three walks — the culture half of the KLX pair.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kuala Lumpur's heritage, monument by monument · KLXxC(ulture)",
    description:
      "9 quarters, 3 walks, National Heritage sites mapped honestly. The 3D map is the front door.",
    url: "https://klx.nonarkara.org",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KLXxC(ulture) — Kuala Lumpur's heritage, monument by monument",
  alternateName: "KLX",
  url: "https://klx.nonarkara.org",
  description:
    "The heritage-focused 3D atlas of Kuala Lumpur: 9 quarters, 3 walks, National Heritage sites from Jabatan Warisan Negara.",
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
};

export default function Home() {
  const quarters = AREAS.map((a) => ({
    slug: a.slug,
    name: a.name,
    thai: a.thai,
    tagline: a.tagline,
    center: a.center,
    zoom: a.zoom,
    photo: a.photo ? `/heritage/photos/${a.photo}.jpg` : undefined,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomepageClient quarters={quarters} />
    </>
  );
}
