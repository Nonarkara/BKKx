"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./i18n/LocaleContext";
import { LangToggle } from "./i18n/LangToggle";

// The shared masthead of the heritage register pages (home, areas, walks).
// The Minecraft-facing pages (/worlds, /atlas) keep their own dark chrome.
//
// THE PHONE NAVIGATION
//
// This used to be a horizontally scrolling strip with the scrollbar hidden.
// Eleven destinations in 294px meant eight of them sat past the right edge
// with nothing on screen to say they were there — the strip even cut a word
// in half ("T" for "The case") at the fold, which reads as a rendering fault
// rather than as an invitation to swipe. Measured across the surface, 176
// public pages carried it.
//
// It is now the same labelled disclosure the front door uses: a Browse button
// that opens every destination in one panel, Escape to close it, and focus
// returned to the button so the keyboard never loses its place. The language
// switch stays on the masthead, outside the panel, because it is a control
// rather than a destination.
export function PlaceMasthead() {
  const { t, locale } = useLocale();
  const th = locale === "th";
  const [navOpen, setNavOpen] = useState(false);
  const navToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!navOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setNavOpen(false);
      navToggleRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <header className={`register-masthead${navOpen ? " is-nav-open" : ""}`}>
      <Link className="register-wordmark" href="/" aria-label="BKKxC(ulture) home">
        <span>BKK</span>
        <b>x</b>
        <em>C(ulture)</em>
      </Link>
      <nav className="register-nav" aria-label="Primary navigation">
        <button
          ref={navToggleRef}
          type="button"
          className="register-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="register-destinations"
          onClick={() => setNavOpen((open) => !open)}
        >
          {th ? "เมนู" : "Browse"}
        </button>
        <div id="register-destinations" className="register-nav-scroll">
          <Link href="/rowhouses">Rowhouses</Link>
          <a href="https://shophouses.nonarkara.org" title="Shophouse Metropolis — the essay, the Bible, the citywide pressure map">Shophouses</a>
          <a href="https://atlas.nonarkara.org" title="The operational city twin — live weather, traffic and block-by-block layers">Digital twin</a>
          <Link href="/case-for-bangkok">The case</Link>
          <Link href="/datasets" title="Every public dataset — sourced, licensed, checksummed">Data</Link>
          <Link href="/warroom" title="The operational picture — live gauges, cameras and the counted corpus">War room</Link>
          <Link href="/heritage#quarters">{t("nav_quarters")}</Link>
          <Link href="/heritage#walks">{t("nav_walks")}</Link>
          <Link href="/heritage#register">{t("nav_register")}</Link>
          <Link href="/about">{t("nav_about")}</Link>
          <a href="https://github.com/Nonarkara/BKKx" target="_blank" rel="noreferrer">
            {t("nav_github")}
          </a>
        </div>
        <LangToggle />
      </nav>
    </header>
  );
}
