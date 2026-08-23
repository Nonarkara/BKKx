import type { Metadata } from "next";
import Link from "next/link";

// A forwarding address, not a resurrection. The manuscript lived at this
// URL until 31b9682, when it was split from the companion essay and left
// the site to become the book chapter. The URL kept arriving in inboxes
// and audit reports as a 404; this page is the ten-line answer both audits
// suggested — say where the chapter went, offer everything that remains.

export const metadata: Metadata = {
  title: "The manuscript · Shophouse Metropolis",
  description:
    "The manuscript left this site to become the book chapter. What remains here: the companion essay, the print edition, the Bible, the global research and the pressure atlas.",
  robots: { index: false },
  alternates: { canonical: "/shophouses/manuscript" },
};

export default function ManuscriptPage() {
  return (
    <div className="shophouse-essay">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Manuscript">
          <Link href="/shophouses">Essay</Link>
          <Link href="/shophouses/bible">Bible</Link>
          <Link href="/shophouses/research">Sources</Link>
        </nav>
      </header>

      <article className="sh-lede sh-forwarding">
        <p className="sh-eyebrow">A forwarding address</p>
        <h1>The manuscript left this site</h1>
        <p className="sh-subtitle">
          It became the book chapter — edited in Dr&nbsp;Non&apos;s own voice,
          delivered as a document rather than a webpage.
        </p>
        <p className="sh-byline">
          What stayed behind is the companion: the essay this chapter grew out
          of, the evidence it stands on, and the maps it argues from. If a
          citation or a bookmark brought you here, one of these is the page
          you wanted.
        </p>

        <ul className="sh-forwarding-list">
          <li>
            <Link href="/shophouses">The essay</Link>
            <span>
              the companion to the chapter — the argument, the corridor, the
              embedded pressure map
            </span>
          </li>
          <li>
            <Link href="/shophouses/print">The print edition</Link>
            <span>the short version typeset for A4, source of the PDF</span>
          </li>
          <li>
            <Link href="/shophouses/atlas">The pressure atlas</Link>
            <span>
              every candidate shophouse in Bangkok over the land value that
              decides its fate
            </span>
          </li>
          <li>
            <Link href="/shophouses/bible">The Bible</Link>
            <span>
              anatomy, measured dimensions, the legal cage, the stock record
            </span>
          </li>
          <li>
            <Link href="/shophouses/global">Global research</Link>
            <span>
              the type outside Bangkok — origin ports, migration vectors,
              verdicts
            </span>
          </li>
          <li>
            <Link href="/shophouses/research">The bibliography</Link>
            <span>every source, including the ones that disagree</span>
          </li>
        </ul>
      </article>
    </div>
  );
}
