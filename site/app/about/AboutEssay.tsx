"use client";

import { useLocale } from "../i18n/LocaleContext";
import { ABOUT_MS, ABOUT_ZH } from "../data/heritage-translations";

const EN = {
  title: "The city the mayors have to see.",
  eyebrow: "Why this exists",
  paragraphs: [
    "I built the Bangkok atlas first. Kuala Lumpur asked for the same thing: towers that read as themselves, a heritage register that does not lie, and water that is not invented.",
    "Petronas has to read as twins. Merdeka 118 has to have a spire. Menara KL has to have the pink pod. Masjid Negara has to have the umbrella roof. That is not decoration — that is why the mayors are in the room.",
    "The numbers we show are numbers that have a source. CTBUH for architectural height. Jabatan Warisan Negara for gazetting. OpenStreetMap for footprints. JPS InfoBanjir has no documented public JSON API, so we do not scrape a mirror.",
    "Flood here is drawn as an interpretive 90 m corridor around OSM rivers, labelled not zon banjir. Land price is listing bands, not NAPIC parcels.",
    "Batu Caves is in Gombak, Selangor. This atlas shows it and says so. WP KL and DBKL cannot claim it.",
    "There is no Minecraft world for Kuala Lumpur on this branch. Atlas only. We do not invent chunks.",
    "The cameras we link are public YouTube feeds and the KLCCC portal. No DBKL CCTV URL is invented. Placeholder markers share one nominal coordinate.",
    "The register here is small on purpose: twenty sites, fourteen gazetted, six waiting. Better a short list you can check than 571 rows copied from another city.",
    "That is the whole argument: show the city as it is, with labels where we interpret, so a meeting with the mayors starts from the same map.",
  ],
  captions: {
    portrait: "Petronas at night — the face of the city the world already knows.",
    thammasat: "The civic core: padang, copper domes, clock tower.",
    watarun1: "KLCC and the park the towers were designed to be seen across.",
    temples: "茨厂街 — fabric, not a gazette entry.",
    foodstalls: "Kampung Baru under the towers.",
    safecity: "Brickfields and the Hubback station.",
    shophouses: "Bukit Bintang at night.",
    alley: "Chow Kit — the economy a register rarely holds.",
    waterfront: "The two-river confluence.",
    openspace: "Thean Hou on the hillside.",
  },
};

function Figure({
  src,
  alt,
  caption,
  eager,
}: {
  src: string;
  alt: string;
  caption: string;
  eager?: boolean;
}) {
  return (
    <figure className="register-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Para({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="register-intro">
      <p lang={lang}>{children}</p>
    </div>
  );
}

export function AboutEssay() {
  const { locale } = useLocale();
  const overlay = locale === "ms" ? ABOUT_MS : locale === "zh" ? ABOUT_ZH : null;
  const p = overlay ? overlay.paragraphs : EN.paragraphs;
  const c = overlay ? overlay.captions : EN.captions;
  const lang = overlay ? locale : undefined;

  return (
    <>
      <p className="register-eyebrow">{overlay ? overlay.eyebrow : EN.eyebrow}</p>
      <h2>{overlay ? overlay.title : EN.title}</h2>

      <Figure
        src="/heritage/photos/klx-hero.jpg"
        alt="Petronas Twin Towers and the Kuala Lumpur skyline at night"
        caption={c.portrait}
        eager
      />
      <Para lang={lang}>{p[0]}</Para>

      <Figure
        src="/heritage/photos/merdeka-core.jpg"
        alt="Sultan Abdul Samad Building and Dataran Merdeka"
        caption={c.thammasat}
        eager
      />
      <div className="register-intro">
        <p lang={lang}>{p[1]}</p>
        <p lang={lang}>{p[2]}</p>
      </div>

      <Figure
        src="/heritage/photos/klcc.jpg"
        alt="Petronas Twin Towers across KLCC Park"
        caption={c.watarun1}
      />
      <Para lang={lang}>{p[3]}</Para>

      <Figure
        src="/heritage/photos/petaling-street.jpg"
        alt="Petaling Street arcade, 茨厂街"
        caption={c.temples}
      />
      <Para lang={lang}>{p[4]}</Para>

      <Figure
        src="/heritage/photos/kampung-baru.jpg"
        alt="Kampung Baru wooden houses under the KLCC skyline"
        caption={c.foodstalls}
      />
      <Para lang={lang}>{p[5]}</Para>

      <Figure
        src="/heritage/photos/brickfields.jpg"
        alt="Brickfields and the Kuala Lumpur Railway Station"
        caption={c.safecity}
      />
      <Figure
        src="/heritage/photos/bukit-bintang.jpg"
        alt="Bukit Bintang at night"
        caption={c.shophouses}
      />
      <Para lang={lang}>{p[6]}</Para>

      <Figure
        src="/heritage/photos/chow-kit.jpg"
        alt="Chow Kit market street"
        caption={c.alley}
      />
      <Para lang={lang}>{p[7]}</Para>

      <Figure
        src="/heritage/photos/river-of-life.jpg"
        alt="Sungai Klang and Sungai Gombak at Masjid Jamek"
        caption={c.waterfront}
      />
      <Para lang={lang}>{p[8]}</Para>

      <Figure
        src="/heritage/photos/thean-hou.jpg"
        alt="Thean Hou Temple on the hillside"
        caption={c.openspace}
      />
    </>
  );
}
