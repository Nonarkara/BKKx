import type { Metadata } from "next";
import { EssayView } from "./EssayView";
import { ESSAY_META } from "../data/shophouse-essay";

export const metadata: Metadata = {
  title: `${ESSAY_META.title} · Shophouse Metropolis`,
  description:
    "Bangkok has roughly 400,000 shophouses and no inventory of them. An essay on reuse, embodied carbon, and why the city's real smart-city problem is legitimacy rather than technology — with the Sukhumvit 71 corridor screened from open data.",
  alternates: { canonical: "/shophouses" },
  openGraph: {
    title: `${ESSAY_META.title} — ${ESSAY_META.subtitle}`,
    description:
      "The third essay in the Harvard GSD Shophouse Metropolis studio book, with an interactive corridor survey and a sourced reuse-versus-demolition carbon model.",
    url: "/shophouses",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  headline: ESSAY_META.title,
  alternativeHeadline: ESSAY_META.subtitle,
  author: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
  isPartOf: {
    "@type": "Book",
    name: "Shophouse Metropolis",
    publisher: "Harvard University Graduate School of Design",
  },
  dateModified: ESSAY_META.updated,
  about: ["Adaptive reuse", "Shophouse", "Bangkok", "Embodied carbon", "Informal urbanism"],
};

export default function ShophousesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <EssayView />
    </>
  );
}
