"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WeatherPayload } from "../../worker/live";
import { CAMERA_TALLY } from "../data/cctv-cameras";

/* Compact live readout for the heritage front door.
 *
 * The map is the page; this strip is the one line that says what Bangkok
 * is doing *right now* — clock, a temperature or an honest blank, PM2.5
 * when the air feed answers, and how many cameras have a real position.
 * Failures stay blank rather than becoming a decorative zero. The Worker
 * proxies Open-Meteo, so the browser never hands the visitor's IP to a
 * third party. */

type Envelope<T> = {
  ok: boolean;
  fetchedAt: string;
  source: string;
  data?: T;
  reason?: string;
};

const WEATHER_POLL_MS = 900_000;

function ictClock(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function LiveStrip() {
  const [now, setNow] = useState<string | null>(null);
  const [weather, setWeather] = useState<Envelope<WeatherPayload> | null>(null);

  useEffect(() => {
    const tick = () => setNow(ictClock(new Date()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const res = await fetch("/api/live/weather", { headers: { accept: "application/json" } });
        const env = (await res.json()) as Envelope<WeatherPayload>;
        if (live) setWeather(env);
      } catch {
        if (live) {
          setWeather({
            ok: false,
            fetchedAt: new Date().toISOString(),
            source: "/api/live/weather",
            reason: "unreachable",
          });
        }
      }
    };
    const first = setTimeout(() => void load(), 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, WEATHER_POLL_MS);
    return () => {
      live = false;
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const d = weather?.data;
  const temp =
    d?.forecastAvailable && d.temperatureC != null ? `${Math.round(d.temperatureC)}°` : null;
  const pm =
    d?.airAvailable && d.pm25 != null ? `PM ${Math.round(d.pm25)}` : null;
  const weatherLabel = temp ?? (weather && !weather.ok ? "no feed" : "…");

  return (
    <p className="atlas-live-strip" aria-label="Bangkok, live">
      <span className="atlas-live-clock" suppressHydrationWarning>
        {now ?? "--:--:--"}
      </span>
      <span className="atlas-live-zone">ICT</span>
      <span className={`atlas-live-wx${temp ? " is-live" : weather && !weather.ok ? " is-down" : ""}`}>
        {weatherLabel}
      </span>
      {pm ? <span className="atlas-live-pm">{pm}</span> : null}
      <Link
        href="/warroom"
        className="atlas-live-cams"
        title="Located live cameras on the map; the war room has the full rail, including streams still awaiting a place"
      >
        ◉ {CAMERA_TALLY.located} live
      </Link>
    </p>
  );
}
