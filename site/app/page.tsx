import type { Metadata } from "next";
import Link from "next/link";
import { HeritageExplorer } from "./HeritageExplorer";

export const metadata: Metadata = {
  title: "Bangkok's heritage, monument by monument",
  description:
    "Every registered ancient monument in Bangkok, drawn from the Fine Arts Department register — what it is, when it was gazetted, and where to stand in a Minecraft Bangkok to see it.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Bangkok's heritage, monument by monument · BKKx",
    description:
      "571 registered and pending ancient monuments, mapped honestly — and 125 you can walk to block by block.",
    url: "/",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Bangkok heritage register — BKKx",
  description:
    "Fine Arts Department registered ancient monument positions for Bangkok, relocated to building precision where the published coordinate is too coarse, and mapped to Minecraft world coordinates.",
  license: "https://creativecommons.org/licenses/by/4.0/",
  isBasedOn: "https://data.go.th/dataset/gis-finearts",
  url: "https://bkk.nonarkara.org",
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="register">
        <header className="register-masthead">
          <Link className="register-wordmark" href="/" aria-label="BKKx home">
            <span>BKK</span>
            <b>x</b>
          </Link>
          <nav className="register-nav" aria-label="Primary navigation">
            <Link href="/worlds">The worlds</Link>
            <Link href="/atlas/historic-core">3D atlas</Link>
            <a
              href="https://github.com/Nonarkara/BKKx"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </header>

        <article className="register-lede">
          <p className="register-eyebrow">
            <span lang="th">ทะเบียนโบราณสถาน กรุงเทพมหานคร</span>
          </p>
          <h1>
            Bangkok&apos;s heritage,
            <br />
            monument by monument.
          </h1>
          <div className="register-intro">
            <p>
              The Fine Arts Department keeps a register of Thailand&apos;s ancient
              monuments — the temples, forts, bridges, canals and shophouse rows
              the state has judged worth protecting. Five hundred and
              seventy-one of them are in Bangkok. This is all of them, on one
              map, with what the register actually says about each.
            </p>
            <p>
              A monument is either <b>gazetted</b> — formally registered in the
              Royal Gazette, with a volume and a date — or still{" "}
              <b>awaiting consideration</b>. Both are here, and the difference is
              marked, because a building waiting on a decision is the one most
              likely to be gone before the decision arrives.
            </p>
            <p>
              BKKx also rebuilds parts of Bangkok as Minecraft worlds at one
              block to the metre. Where a monument falls inside one of those
              worlds, the register gives you the coordinate to stand on.{" "}
              <Link href="/worlds">The worlds are here</Link>.
            </p>
          </div>
        </article>

        <HeritageExplorer />
      </div>
    </>
  );
}
