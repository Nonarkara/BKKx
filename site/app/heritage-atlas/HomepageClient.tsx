"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Quarter = {
  slug: string;
  name: string;
  thai?: string;
  center: [number, number];
  zoom: number;
  tagline?: string;
};

type Props = {
  quarters: Quarter[];
  initialQuarter?: string;
  atlasBase: string;
};

const DEFAULT_ATLAS_BASE = "https://atlas.nonarkara.org";

function atlasUrlFor(base: string, q: Quarter | null): string {
  if (!q) return base + "/";
  // The atlas accepts ?at=lng,lat,zoom for external fly-to (added 2026-08-11
  // to support bkk's quarter chips). The atlas also accepts #area-id for its
  // own quick-jumps — we prefer ?at= because every bkk quarter has a
  // precise center+zoom, but the 16 atlas areas don't cover all 9 bkk quarters.
  return `${base}/?at=${q.center[0]},${q.center[1]},${q.zoom}`;
}

export function HomepageClient({ quarters, initialQuarter, atlasBase }: Props) {
  const base = atlasBase || DEFAULT_ATLAS_BASE;
  const [activeSlug, setActiveSlug] = useState<string | null>(initialQuarter ?? null);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeQuarter = activeSlug ? quarters.find((q) => q.slug === activeSlug) : null;
  const initialSrc = atlasUrlFor(base, activeQuarter ?? null);

  // Reload the iframe on quarter change — the atlas accepts ?at= and
  // re-flys on load. A postMessage channel would be smoother but
  // requires the atlas to listen, which it doesn't yet.
  function pickQuarter(q: Quarter) {
    if (q.slug === activeSlug) return;
    setActiveSlug(q.slug);
    setIframeKey((k) => k + 1);
  }

  return (
    <div className="atlas-shell">
      <header className="atlas-shell-masthead" aria-label="BKKx primary">
        <Link className="register-wordmark" href="/" aria-label="BKKx home">
          <span>BKK</span>
          <b>x</b>
        </Link>
        <div className="atlas-shell-masthead-meta">
          <span className="register-eyebrow">
            <span lang="th">กรุงเทพมหานคร · Bangkok</span>
          </span>
          <strong>Bangkok&apos;s heritage, block by block.</strong>
          <small>
            The 3D map is the front door. Nine quarters, seven walks, 571
            registered monuments, the Minecraft worlds that let you walk
            them.
          </small>
        </div>
        <nav className="atlas-shell-nav" aria-label="Heritage navigation">
          <Link href="/#register">Register</Link>
          <Link href="/heritage">Walks</Link>
          <Link href="/worlds">The worlds</Link>
          <Link
            className="atlas-shell-download"
            href="/atlas/ratchathewi"
          >
            Walk Ratchathewi <span aria-hidden="true">↓</span>
          </Link>
          <Link
            className="atlas-shell-download"
            href="/atlas/historic-core"
          >
            Walk Old Town <span aria-hidden="true">↓</span>
          </Link>
        </nav>
      </header>

      <div className="atlas-shell-body">
        <aside className="atlas-shell-quarters" aria-label="Heritage quarters">
          <p className="register-eyebrow">Quarters</p>
          <h2 className="register-section-title atlas-shell-quarters-title">
            Nine quarters of the old city
          </h2>
          <p className="atlas-shell-quarters-lede">
            From the royal island to the green lung. Click a quarter to fly
            the map there. Each one is a hand-curated page with its
            monuments, its walks and its own history.
          </p>
          <ol className="atlas-shell-quarter-chips">
            {quarters.map((q) => {
              const isActive = q.slug === activeSlug;
              return (
                <li key={q.slug}>
                  <button
                    type="button"
                    className={isActive ? "is-active" : ""}
                    onClick={() => pickQuarter(q)}
                    aria-pressed={isActive}
                  >
                    <span className="atlas-shell-quarter-name">
                      {q.name}
                      {q.thai ? (
                        <small lang="th"> {q.thai}</small>
                      ) : null}
                    </span>
                    {q.tagline ? (
                      <span className="atlas-shell-quarter-tag">{q.tagline}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>

          <p className="register-eyebrow atlas-shell-quarters-after">Side offers</p>
          <p className="atlas-shell-side">
            <Link href="/atlas/ratchathewi">Minecraft world · Ratchathewi (4.96 × 2.95 km)</Link>
            <Link href="/atlas/historic-core">Minecraft world · Historic Core (3.38 × 3.22 km)</Link>
            <Link href="/worlds">All worlds, manifest, install instructions</Link>
            <a href="https://github.com/Nonarkara/BKKx" target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          </p>

          <p className="atlas-shell-footnote">
            The 3D map is the live{" "}
            <a href={base} target="_blank" rel="noreferrer">
              atlas.nonarkara.org
            </a>{" "}
            — same engine, with the heritage lens added by this shell. All
            data: OpenStreetMap (ODbL), Fine Arts Department register,
            Longdo / iTIC, Treasury, HII / ThaiWater. See{" "}
            <Link href="/#register">the register</Link> for source notes.
          </p>
        </aside>

        <div className="atlas-shell-map">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={initialSrc}
            title="Bangkok 3D atlas — heritage view"
            loading="eager"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
