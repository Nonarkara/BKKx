"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RainPayload, WeatherPayload, ThaiWarningsPayload } from "../../worker/live";

/* CityGlance — the landing page's first line.
 *
 * The reader glances here, then looks at the map. Four observed-or-modelled
 * Bangkok numbers plus the warning state, each labelled with the source that
 * produced it, each linking to the war room where the full panel lives with
 * its failure modes. Fetched once on mount: this is a glance, not a
 * monitor — the war room polls, this strip does not.
 *
 * Editorial chrome, not Console: paper ground, ink rules, mono figures. No
 * panel on this strip renders a number it did not receive; a dead feed
 * reads "no feed" with the reason on hover, never a zero.
 */

type Envelope<T> = { ok: boolean; fetchedAt: string; source: string; data?: T; reason?: string };

type Glance = {
  wx?: Envelope<WeatherPayload>;
  rain?: Envelope<RainPayload>;
  warn?: Envelope<ThaiWarningsPayload>;
};

function Item({
  label,
  thai,
  value,
  unit,
  sub,
  title,
  alert,
}: {
  label: string;
  thai: string;
  value: string;
  unit?: string;
  sub: string;
  title: string;
  alert?: boolean;
}) {
  return (
    <Link
      className={`city-glance-item${alert ? " is-alert" : ""}`}
      href="/warroom"
      title={title}
    >
      <span className="city-glance-value">
        {value}
        {unit ? <span className="city-glance-unit">{unit}</span> : null}
      </span>
      <span className="city-glance-label">
        {label} · <span lang="th">{thai}</span>
      </span>
      <span className="city-glance-sub">{sub}</span>
    </Link>
  );
}

export function CityGlance() {
  const [g, setG] = useState<Glance>({});

  useEffect(() => {
    let live = true;
    (async () => {
      const get = async <T,>(path: string): Promise<Envelope<T> | undefined> => {
        try {
          const res = await fetch(path, { headers: { accept: "application/json" } });
          return (await res.json()) as Envelope<T>;
        } catch {
          return undefined;
        }
      };
      const [wx, rain, warn] = await Promise.all([
        get<WeatherPayload>("/api/live/weather"),
        get<RainPayload>("/api/live/rain"),
        get<ThaiWarningsPayload>("/api/live/thaiwater-warnings"),
      ]);
      if (live) setG({ wx, rain, warn });
    })();
    return () => {
      live = false;
    };
  }, []);

  const wx = g.wx?.ok ? g.wx.data : undefined;
  const rain = g.rain?.ok ? g.rain.data : undefined;
  const warn = g.warn?.ok ? g.warn.data : undefined;

  const temp = wx?.temperatureC;
  const heaviest = rain
    ? [...rain.stations].sort((a, b) => b.mm - a.mm)[0]
    : undefined;

  return (
    <section className="city-glance" aria-label="Bangkok right now">
      <Item
        label="Now"
        thai="ขณะนี้"
        value={temp == null ? "—" : temp.toFixed(1)}
        unit={temp == null ? undefined : "°C"}
        sub={
          g.wx === undefined
            ? "polling the forecast…"
            : wx
              ? "Open-Meteo forecast · war room →"
              : (g.wx.reason ?? "no feed")
        }
        title={g.wx?.ok ? `Forecast ${wx?.observedAt ?? ""}. ${wx?.attribution ?? ""}` : (g.wx?.reason ?? "Forecast unavailable")}
      />
      <Item
        label="Rain 24 h"
        thai="ฝน 24 ชม."
        value={rain === undefined ? "—" : rain.maxMm.toFixed(1)}
        unit={rain === undefined ? undefined : "mm"}
        sub={
          g.rain === undefined
            ? "polling the gauges…"
            : rain
              ? `${rain.wet}/${rain.stationCount} stations wet${heaviest?.district ? ` · heaviest ${heaviest.district}` : ""} · BMA via ThaiWater →`
              : (g.rain.reason ?? "no feed")
        }
        title={g.rain?.ok ? (rain?.agency ?? "") : (g.rain?.reason ?? "Gauge network unavailable")}
      />
      <Item
        label="Rain chance"
        thai="โอกาสฝน"
        value={wx?.rainChanceNext24h === undefined || wx?.rainChanceNext24h === null ? "—" : String(Math.round(wx.rainChanceNext24h))}
        unit={wx?.rainChanceNext24h == null ? undefined : "%"}
        sub={
          wx?.rainNext24hMm != null
            ? `≈${wx.rainNext24hMm.toFixed(1)} mm forecast · model, not gauges →`
            : (g.wx === undefined ? "polling the forecast…" : (g.wx?.reason ?? "no feed"))
        }
        title="Open-Meteo hourly precipitation probability, next 24 h. When it disagrees with a gauge, the gauge is what happened."
      />
      <Item
        label="PM2.5"
        thai="ฝุ่น"
        value={wx?.pm25 === undefined || wx?.pm25 === null ? "—" : wx.pm25.toFixed(0)}
        unit={wx?.pm25 == null ? undefined : "µg/m³"}
        sub={
          wx?.pm25 != null
            ? `${wx.pm25 > 37.5 ? "above the 24 h guideline · " : "modelled · "}CAMS →`
            : (g.wx === undefined ? "polling…" : (g.wx?.reason ?? "no feed"))
        }
        title="Modelled PM2.5 (CAMS), not a roadside sensor. Air4Thai's station network is the ground truth and is not yet wired."
      />
      <Item
        label="Warnings"
        thai="เตือนภัย"
        value={warn === undefined ? "—" : String(warn.bangkokCount)}
        sub={
          g.warn === undefined
            ? "polling HII…"
            : warn
              ? (warn.bangkokCount > 0 && warn.bangkok[0]
                ? `${warn.bangkok[0].message.slice(0, 64)}${warn.bangkok[0].message.length > 64 ? "…" : ""}`
                : `none in Bangkok · ${warn.nationalCount} nationwide →`)
              : (g.warn.reason ?? "no feed")
        }
        title={g.warn?.ok ? (warn?.attribution ?? "") : (g.warn?.reason ?? "Warning table unavailable")}
        alert={(warn?.bangkokCount ?? 0) > 0}
      />
    </section>
  );
}
