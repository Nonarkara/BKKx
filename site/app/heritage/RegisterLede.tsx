"use client";

import Link from "next/link";
import { useLocale } from "../i18n/LocaleContext";
import { REGISTER_LEDE_MS, REGISTER_LEDE_ZH } from "../data/heritage-translations";

export function RegisterLede() {
  const { locale } = useLocale();
  const overlay = locale === "ms" ? REGISTER_LEDE_MS : locale === "zh" ? REGISTER_LEDE_ZH : null;
  const lang = overlay ? locale : undefined;

  if (!overlay) {
    return (
      <>
        <h1>
          Kuala Lumpur&apos;s heritage,
          <br />
          monument by monument.
        </h1>
        <div className="register-intro">
          <p>
            Jabatan Warisan Negara keeps Malaysia&apos;s National Heritage lists.
            This page holds the 2007, 2009 and 2012 entries that can be mapped
            in WP Kuala Lumpur, plus named OSM landmarks. It is a WP KL slice,
            not a dump of every gazetted building in the country.
          </p>
          <p>
            A site is either <b>gazetted</b> — National Heritage, with a year —
            or iconic but not on the lists pulled here. Both are here, and the
            difference is marked. The Petronas towers are not waiting on a
            gazette to still be standing.
          </p>
          <p>
            The 3D map is the <Link href="/">front door of KLX</Link> now —
            this register is the drill-down. If you want to read the city
            from above first, the map is on the home page.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 lang={lang}>
        {overlay.h1Line1}
        <br />
        {overlay.h1Line2}
      </h1>
      <div className="register-intro">
        {overlay.intro.map((p, i) => (
          <p key={i} lang={lang}>
            {i === 2 ? (
              <>
                {p.split("KLX")[0]}
                <Link href="/">KLX</Link>
                {p.split("KLX")[1]}
              </>
            ) : (
              p
            )}
          </p>
        ))}
      </div>
    </>
  );
}
