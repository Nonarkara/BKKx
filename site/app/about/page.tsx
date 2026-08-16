import type { Metadata } from "next";
import { PlaceMasthead } from "../PlaceMasthead";
import { AboutClient } from "./AboutClient";

// Bangkok by the numbers — the dry frame for a city you can only
// feel by walking through it. Added 2026-08-11 alongside the
// redesigned front door: the 3D map covers the spatial, the
// register covers the heritage, and this page covers the city in
// the numbers that the city is actually made of (population,
// tourism receipts, PM2.5, the register itself).
//
// Order: numbers first, then the Dr Non essay (the qualitative
// side of the city, in his own words, with photos). Both halves
// live at /about because they answer the same question from two
// directions — what is this city made of, and what does it feel
// like. The end of the numbers section links to the register,
// the quarters, the walks, and the 3D map, so the reader who
// started here lands somewhere physical.

export const metadata: Metadata = {
  title: "Bangkok by the numbers",
  description:
    "Bangkok in numbers: 10.54 million residents, 39.9 million visitors, 571 registered ancient monuments, 432,077 buildings in the 3D atlas. The dry frame, then the walk through the city.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Bangkok by the numbers · BKKx",
    description:
      "The dry frame: population, GDP, tourism receipts, PM2.5, the register. Then the qualitative side of the city.",
    url: "https://bkk.nonarkara.org/about",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BKKxC(ulture) — Bangkok by the numbers",
  alternateName: "BKKx",
  url: "https://bkk.nonarkara.org/about",
  description:
    "Bangkok in numbers — population, GDP, tourism receipts, air quality, the Fine Arts Department register. The dry frame for a city you can only feel by walking through it.",
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
