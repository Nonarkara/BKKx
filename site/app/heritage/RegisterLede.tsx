"use client";

import Link from "next/link";
import { useLocale } from "../i18n/LocaleContext";
import { REGISTER_LEDE_TH } from "../data/heritage-translations-th";

export function RegisterLede() {
  const { locale } = useLocale();
  const th = locale === "th";
  const lang = th ? "th" : undefined;

  if (!th) {
    return (
      <>
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
            seventy-one of them are in Bangkok. This register holds all of
            them, along with the quarters they cluster in and the walks that
            string them together.
          </p>
          <p>
            A monument is either <b>gazetted</b> — formally registered in the
            Royal Gazette, with a volume and a date — or still{" "}
            <b>awaiting consideration</b>. Both are here, and the difference
            is marked, because a building waiting on a decision is the one
            most likely to be gone before the decision arrives.
          </p>
          <p>
            The 3D map is the <Link href="/">front door of BKKx</Link> now —
            this register is the drill-down. If you want to read the city
            from above first, the map is on the home page. If you want to
            read it register-first, you&apos;re in the right place.
          </p>
        </div>
        {/* 18 Nov: msh-audit measured the register's search 4.6 phone
            screens below its lede, and the law says the thing that matters
            must not leave the viewport before the reader finds it. One
            jump line from the lede to the register — no words of the essay
            changed, and the anchor the home page already links to. */}
        <p className="register-jump">
          <a href="#register">↓ Straight to the 571-item register</a>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 lang={lang}>
        {REGISTER_LEDE_TH.h1Line1}
        <br />
        {REGISTER_LEDE_TH.h1Line2}
      </h1>
      <div className="register-intro">
        {REGISTER_LEDE_TH.intro.map((p, i) => (
          <p key={i} lang={lang}>
            {i === 2 ? (
              <>
                {p.split("BKKx")[0]}
                <Link href="/">BKKx</Link>
                {p.split("BKKx")[1]}
              </>
            ) : (
              p
            )}
          </p>
        ))}
      </div>
      {/* Same affordance, Thai: the register's search sits far below the
          lede on a phone, and a reader here reads register-first. */}
      <p className="register-jump" lang={lang}>
        <a href="#register">↓ ไปที่ทะเบียนบูรณะทั้ง 571 แห่ง</a>
      </p>
    </>
  );
}
