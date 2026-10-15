import type { Metadata } from "next";
import localFont from "next/font/local";
import { SHOPHOUSE_TYPES } from "../../data/shophouse-typology";
import { TypologyView } from "./TypologyView";
import "./typology.css";

const zh = localFont({
  src: "./fonts/noto-sans-sc-typology.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-zh",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Shophouse typology · Shophouse Metropolis",
  description:
    "A public library of Bangkok shophouse types, read as dense, mixed-use, incremental housing. The question is how a city houses many people and keeps its core identity. Lat Phrao Road is the type Non grew up in.",
  alternates: { canonical: "/shophouses/typology" },
  openGraph: {
    title: "Shophouse typology",
    description:
      "Bangkok shophouse types, one entry at a time. Elevations drawn for this library. Source drawings credited, not copied.",
    url: "/shophouses/typology",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Shophouse typology",
  url: "https://shophouses.nonarkara.org/shophouses/typology",
  isPartOf: {
    "@type": "WebSite",
    name: "Shophouse Metropolis",
    url: "https://shophouses.nonarkara.org",
  },
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
  citation: [
    "https://urbancreature.co/shophouse-supply/",
    "https://www.instagram.com/p/DeG4utWGjvO/",
    "https://www.instagram.com/shophouse.supply/",
    "https://www.instagram.com/p/DeaILEpk_xF/",
    "https://www.instagram.com/p/DeUKkA8kvDF/",
    "https://www.instagram.com/p/Dedgqo9jFOM/",
    "https://www.instagram.com/p/DeNAO6ZEvAV/",
    "https://archive.org/details/jstor-1013498",
    "https://www.penguinrandomhouse.com/books/86058/the-death-and-life-of-great-american-cities-by-jane-jacobs/",
    "https://archive.org/details/bowlingalonecoll00putn",
    "https://www.marxists.org/reference/subject/philosophy/works/fr/bourdieu-forms-capital.htm",
    "https://www.instagram.com/avanidoesart/",
    "https://www.instagram.com/urbanistcomix/",
    "https://www.instagram.com/abhinavbwj/",
    "https://www.penguinrandomhouse.com/books/303439/triumph-of-the-city-by-edward-glaeser/",
    "https://web.archive.org/web/20231226060819/http://sigus.mit.edu/about.php",
    "https://web.archive.org/web/20241223082938/http://web.mit.edu/incrementalhousing/",
  ],
  hasPart: SHOPHOUSE_TYPES.map((entry) => ({
    "@type": "CreativeWork",
    name: entry.name.en,
    alternateName: [entry.name.th, entry.name.zh, entry.featured?.en, entry.featured?.th, entry.featured?.zh].filter(Boolean),
    description: entry.description.en,
    inLanguage: ["en", "th", "zh"],
    identifier: entry.id,
  })),
};

export default function TypologyPage() {
  return (
    <div className={zh.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <TypologyView />
    </div>
  );
}
