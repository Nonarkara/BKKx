"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";

type WalkPoiKind = "food" | "drink" | "shop" | "history" | "other";
type WalkPoi = { name: string; kind: WalkPoiKind; distanceM: number };
type WalkPoiEntry = {
  walkSlug: string;
  stopN: number;
  stopName: string;
  lat: number;
  lon: number;
  radiusM: number;
  pois: WalkPoi[];
};

const KIND_LABEL: Record<string, Record<WalkPoiKind, string>> = {
  en: {
    food: "Eat",
    drink: "Drink",
    shop: "Shop",
    history: "See",
    other: "Nearby",
  },
  th: {
    food: "กิน",
    drink: "ดื่ม",
    shop: "ซื้อ",
    history: "ดู",
    other: "ใกล้ๆ",
  },
};

const KIND_ORDER: WalkPoiKind[] = ["food", "drink", "shop", "history", "other"];

let cachedData: WalkPoiEntry[] | null = null;
let cachedPromise: Promise<WalkPoiEntry[] | null> | null = null;

function loadAllPois(): Promise<WalkPoiEntry[] | null> {
  if (cachedData) return Promise.resolve(cachedData);
  if (cachedPromise) return cachedPromise;
  cachedPromise = fetch("/heritage/walk-pois.json", { cache: "force-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      cachedData = Array.isArray(d) ? d : Object.values(d ?? {});
      return cachedData;
    })
    .catch(() => {
      cachedData = [];
      return null;
    });
  return cachedPromise;
}

export function WalkNearby({ stopN, walkSlug }: { stopN: number; walkSlug: string }) {
  const { locale, t } = useLocale();
  const th = locale === "th";
  const [data, setData] = useState<WalkPoiEntry[] | null>(cachedData);
  const [loaded, setLoaded] = useState<boolean>(cachedData !== null);

  useEffect(() => {
    if (data !== null) return;
    let cancelled = false;
    loadAllPois().then((d) => {
      if (cancelled) return;
      setData(d);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (!loaded) {
    return null;
  }

  const entry = data?.find((e) => e.walkSlug === walkSlug && e.stopN === stopN);
  if (!entry || entry.pois.length === 0) {
    return (
      <p className="walk-stop-nearby-empty">
        {th
          ? "ร้านและสถานที่ใกล้เคียง — ข้อมูลยังไม่พร้อม"
          : "Nearby food, drink, shops, history — data not yet available for this stop."}
      </p>
    );
  }

  const byKind: Record<string, WalkPoi[]> = {};
  for (const p of entry.pois) {
    (byKind[p.kind] ??= []).push(p);
  }
  const labels = KIND_LABEL[th ? "th" : "en"];

  return (
    <div className="walk-stop-nearby-wrap">
      <p className="walk-stop-nearby-eyebrow">
        {t("walk_nearby_eyebrow")}
        <span className="walk-stop-nearby-radius">
          {th
            ? `ในรัศมี ${entry.radiusM} ม. จากจุดนี้`
            : `within ${entry.radiusM} m of this stop`}
        </span>
      </p>
      <ul className="walk-stop-nearby">
        {KIND_ORDER.filter((k) => byKind[k]?.length).map((k) => (
          <li key={k} className={`walk-stop-nearby-kind is-${k}`}>
            <span className="walk-stop-nearby-kind-label">{labels[k]}</span>
            <ol>
              {byKind[k].slice(0, 4).map((p) => (
                <li key={`${k}-${p.name}`}>
                  <span className="walk-stop-nearby-name">{p.name}</span>
                  <span className="walk-stop-nearby-m">{p.distanceM} m</span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
      <p className="walk-stop-nearby-source">
        {th
          ? "ข้อมูลจาก OpenStreetMap (ODbL) — เรียงตามระยะทางจากจุด"
          : "OpenStreetMap (ODbL) · sorted by distance from this stop"}
      </p>
    </div>
  );
}
