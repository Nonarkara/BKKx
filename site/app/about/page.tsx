import type { Metadata } from "next";
import { PlaceMasthead } from "../PlaceMasthead";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "Kuala Lumpur by the numbers",
  description:
    "Kuala Lumpur in numbers: 1,982,112 residents (MyCensus 2020), 243 km², Petronas 451.9 m, Merdeka 118 678.9 m, a National Heritage register mapped honestly.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Kuala Lumpur by the numbers · KLX",
    description:
      "The dry frame: population, published tower heights, the register, the rivers. Then why the atlas exists.",
    url: "https://klx.nonarkara.org/about",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KLXxC(ulture) — Kuala Lumpur by the numbers",
  alternateName: "KLX",
  url: "https://klx.nonarkara.org/about",
  description:
    "Kuala Lumpur in numbers — population, published tower heights, National Heritage lists, rivers. The dry frame for a city you can only feel by walking through it.",
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="register">
        <PlaceMasthead />
        <AboutClient />
      </div>
    </>
  );
}
