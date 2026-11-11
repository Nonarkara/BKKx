import Link from "next/link";
import { STUDIO } from "../data/shophouse-studio";
import { SUPPORT } from "../data/shophouse-rail";

export function ShMasthead() {
  return (
    <header className="sh-masthead">
      <Link href="/shophouses" className="sh-wordmark">
        Shophouse<em>Metropolis</em>
      </Link>
      <nav aria-label="Essay">
        <Link href="/shophouses#essay">Essay</Link>
        <Link href="/shophouses/why">Why</Link>
        <Link href="/shophouses/typology">Typology</Link>
        <Link href="/shophouses/bible">The Bible</Link>
        <Link href="/shophouses/global">Global</Link>
        <Link href="/shophouses/research">Sources</Link>
        <a href="https://bkk.nonarkara.org" target="_blank" rel="noreferrer">
          BKKx
        </a>
      </nav>
    </header>
  );
}

export function ShFooter() {
  return (
    <footer className="sh-footer">
      <div className="sh-support">
        <p className="sh-eyebrow">Supported by</p>
        <p>{SUPPORT.intro}</p>
        <div className="sh-support-logos">
          {SUPPORT.logos.map((l) => (
            <a key={l.file} href={l.url} target="_blank" rel="noreferrer" title={l.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.file} alt={l.name} loading="lazy" />
            </a>
          ))}
        </div>
      </div>
      <p>
        <strong>{STUDIO.name}</strong> — {STUDIO.critic}, with {STUDIO.institution}. Chair:{" "}
        {STUDIO.chair}. Sponsor: {STUDIO.sponsor}. Site: {STUDIO.site}.
      </p>
      <p className="sh-note">{STUDIO.sourceNote}</p>
      <p>
        Sibling systems:{" "}
        <a href="https://bkk.nonarkara.org" target="_blank" rel="noreferrer">
          bkk.nonarkara.org
        </a>{" "}
        — the heritage register, nine quarters and the rowhouse atlas this corridor screen was built
        from ·{" "}
        <a href="https://atlas.nonarkara.org" target="_blank" rel="noreferrer">
          atlas.nonarkara.org
        </a>{" "}
        — Bangkok&apos;s operational digital twin.
      </p>
    </footer>
  );
}
