import type { Metadata } from "next";
import { HeritageExplorer } from "../HeritageExplorer";
import { PlaceMasthead } from "../PlaceMasthead";
import { RegisterLede } from "./RegisterLede";
import { QuartersIndex, WalksIndex, RegisterMappedHeading } from "./RegisterIndexes";
import { AREAS, WALKS, photoFor } from "../data/heritage-content";

export const metadata: Metadata = {
  title: "Kuala Lumpur's heritage register",
  description:
    "National Heritage sites from Jabatan Warisan Negara mapped in WP Kuala Lumpur, with the quarters they cluster in and the walks that string them together.",
  alternates: { canonical: "/heritage" },
  openGraph: {
    title: "Kuala Lumpur's heritage register · KLXxC(ulture)",
    description:
      "Gazetted National Heritage, named OSM landmarks, nine quarters, three walks — the editorial register behind the atlas.",
    url: "https://klx.nonarkara.org/heritage",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Kuala Lumpur heritage register — KLX",
  description:
    "Jabatan Warisan Negara National Heritage positions for WP Kuala Lumpur, relocated onto OpenStreetMap where a name match exists, with heritage quarters and documented walking routes.",
  license: "https://creativecommons.org/licenses/by/4.0/",
  isBasedOn: "https://www.heritage.gov.my/ms/pengisytiharan-2007.html",
  url: "https://klx.nonarkara.org",
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
};

export default function HeritageRegister() {
  const hero = photoFor("klx-hero");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="register">
        <PlaceMasthead />

        <article className="register-lede">
          <p className="register-eyebrow">
            <span lang="ms">Warisan Kebangsaan Kuala Lumpur</span>
          </p>
          <RegisterLede />

          {hero ? (
            <figure className="register-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.file}
                alt="Petronas Twin Towers and the Kuala Lumpur skyline at night"
                loading="eager"
              />
              <figcaption>
                Petronas Twin Towers at night — CTBUH 451.9 m architectural. Photo: {hero.artist} ·{" "}
                <a href={hero.descriptionUrl} target="_blank" rel="noreferrer">
                  Wikimedia Commons
                </a>{" "}
                · {hero.licence}.
              </figcaption>
            </figure>
          ) : null}
        </article>

        <div className="register-indexes register-lede">
          <QuartersIndex areas={AREAS} />
          <WalksIndex walks={WALKS} />
        </div>

        <section id="register" aria-label="The register, mapped">
          <RegisterMappedHeading />
          <HeritageExplorer />
        </section>
      </div>
    </>
  );
}
