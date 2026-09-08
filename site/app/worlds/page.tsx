import type { Metadata } from "next";
import { BangkokWalkthrough } from "../walkthrough";

export const metadata: Metadata = {
  title: "The atlas",
  description:
    "Walk Kuala Lumpur in a 3D browser atlas — Merdeka civic core, KLCC and the Klang Valley. Atlas only: no Minecraft world has been generated.",
  alternates: { canonical: "/worlds" },
  openGraph: {
    title: "The atlas · KLXxC(ulture)",
    description:
      "Three Kuala Lumpur districts as a 3D atlas. No Minecraft world ships on this branch.",
    url: "/worlds",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KLXxC(ulture)",
  alternateName: "Kuala Lumpur, monument by monument",
  url: "https://klx.nonarkara.org",
  description:
    "An open 3D atlas of Kuala Lumpur's heritage and iconic towers.",
  creator: {
    "@type": "Person",
    name: "Non Arkara",
    url: "https://nonarkara.org",
  },
};

export default function WorldsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BangkokWalkthrough />
    </>
  );
}
