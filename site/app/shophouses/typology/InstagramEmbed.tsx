"use client";

import { useEffect, useRef, useState } from "react";
import type { TypologyEmbed } from "../../data/shophouse-typology";

const SCRIPT = "https://www.instagram.com/embed.js";

function permalink(embed: TypologyEmbed): string {
  const url = embed.postUrl.replace(/\/$/, "");
  return `${url}/?img_index=${embed.imageIndex}`;
}

type WindowWithInstagram = Window & {
  instgrm?: { Embeds?: { process?: () => void } };
};

export function InstagramEmbed({
  embed,
  name,
  handle,
  article,
}: {
  embed: TypologyEmbed;
  name: string;
  handle: string;
  article?: string;
}) {
  const quoteRef = useRef<HTMLQuoteElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  const link = permalink(embed);

  useEffect(() => {
    const node = quoteRef.current;
    if (!node) return;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const process = () => {
        (window as WindowWithInstagram).instgrm?.Embeds?.process?.();
      };
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (existing) {
        process();
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      script.onload = process;
      script.onerror = () => setBlocked(true);
      document.body.appendChild(script);
    };
    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [link]);

  const credit = `${name}, ${handle}`;
  return (
    <figure className="typo-embed">
      <div className="typo-embed-frame">
        <blockquote
          ref={quoteRef}
          className="instagram-media"
          data-instgrm-permalink={link}
          data-instgrm-version="14"
        >
          <a href={link}>{credit}</a>
        </blockquote>
      </div>
      <figcaption>
        <a href={link}>{credit}</a>
        {article ? (
          <>
            {" · "}
            <a href={article}>Urban Creature, 5 Oct 2026</a>
          </>
        ) : null}
        {blocked ? " · the embed did not load" : null}
      </figcaption>
    </figure>
  );
}
