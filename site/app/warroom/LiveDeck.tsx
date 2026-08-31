"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Camera, RainPayload, WeatherPayload, FirePayload } from "../../worker/live";
import {
  CURATED_CAMERAS,
  CAMERA_TALLY,
  posterFor,
  embedFor,
  isLocated,
  type CuratedCamera,
} from "../data/cctv-cameras";
import { SuggestLocation } from "./SuggestLocation";

/* The live half of the war room: the clock, the gauge network, and the
   camera rail. Everything here degrades to a stated reason rather than a
   number — an operator who cannot tell "no rain" from "no feed" is worse
   off than one with no panel at all. */

type Envelope<T> = { ok: boolean; fetchedAt: string; source: string; data?: T; reason?: string };
type CctvPayload = { cameras: Camera[]; cameraCount: number; configured: boolean };

const RAIN_POLL_MS = 300_000; // matches the edge TTL — polling faster only hits cache
const CAM_REFRESH_MS = 30_000;
const WEATHER_POLL_MS = 900_000; // matches the edge TTL
const FIRE_POLL_MS = 1_800_000; // matches the edge TTL (FIRMS quota discipline)

/* ---------------------------------------------------------------- clock */
export function BangkokClock({ buildIso }: { buildIso: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const built = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(buildIso));

  return (
    <div className="wr-clock">
      <span className="wr-clock-time">
        {/* Server-rendered as em-dash: the server's clock is not the reader's. */}
        {now ?? "--:--:--"}
      </span>
      <span className="wr-clock-zone">ICT · Asia/Bangkok</span>
      <span className="wr-clock-build">
        static layers built <b>{built}</b>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ gauges */
export function RainPanel() {
  const [state, setState] = useState<{ phase: "loading" | "ok" | "down"; env?: Envelope<RainPayload> }>({
    phase: "loading",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/live/rain", { headers: { accept: "application/json" } });
      const env = (await res.json()) as Envelope<RainPayload>;
      setState({ phase: env.ok ? "ok" : "down", env });
    } catch (err) {
      setState({
        phase: "down",
        env: {
          ok: false,
          fetchedAt: new Date().toISOString(),
          source: "/api/live/rain",
          reason: `Could not reach this site's own live endpoint: ${(err as Error).message}`,
        },
      });
    }
  }, []);

  useEffect(() => {
    // Deferred rather than called in the effect body: a synchronous setState
    // here cascades a second render before paint.
    const first = setTimeout(() => void load(), 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, RAIN_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  const d = state.env?.data;

  return (
    <section className="wr-panel" aria-labelledby="wr-rain-h">
      <header className="wr-panel-head">
        <h2 id="wr-rain-h">Gauge network</h2>
        <span className={`wr-state is-${state.phase}`}>
          <i aria-hidden="true" />
          {state.phase === "loading" ? "polling" : state.phase === "ok" ? "live" : "no feed"}
        </span>
      </header>

      {state.phase === "ok" && d ? (
        <>
          <div className="wr-rain-row">
            <div className="wr-tally is-signal">
              <p className="wr-tally-value">
                {d.maxMm.toFixed(1)}
                <span className="wr-tally-unit">mm</span>
              </p>
              <p className="wr-tally-label">Heaviest station</p>
            </div>
            <div className="wr-tally">
              <p className="wr-tally-value">
                {d.wet}
                <span className="wr-tally-unit">/ {d.stationCount}</span>
              </p>
              <p className="wr-tally-label">Stations reporting rain</p>
            </div>
          </div>
          <p className="wr-panel-note">
            {d.agency}. Reading fetched{" "}
            {new Date(state.env!.fetchedAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok" })} ICT
            {d.unreadable > 0 ? ` · ${d.unreadable} row(s) unreadable` : ""}.
          </p>
        </>
      ) : state.phase === "loading" ? (
        <p className="wr-panel-note">Polling the drainage department&apos;s gauge feed…</p>
      ) : (
        <div className="wr-degraded">
          <p className="wr-degraded-reason">{state.env?.reason ?? "Feed unavailable."}</p>
          <p className="wr-panel-note">
            No figure is shown, deliberately: an unreachable gauge network and a
            city with no rain are opposite facts, and this panel will not render
            one as the other.
          </p>
          <button type="button" className="wr-btn" onClick={() => void load()}>
            Retry now
          </button>
        </div>
      )}
    </section>
  );
}

/* ----------------------------------------------------------- weather */
export function WeatherPanel() {
  const [state, setState] = useState<{ phase: "loading" | "ok" | "down"; env?: Envelope<WeatherPayload> }>({
    phase: "loading",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/live/weather", { headers: { accept: "application/json" } });
      const env = (await res.json()) as Envelope<WeatherPayload>;
      setState({ phase: env.ok ? "ok" : "down", env });
    } catch (err) {
      setState({
        phase: "down",
        env: {
          ok: false,
          fetchedAt: new Date().toISOString(),
          source: "/api/live/weather",
          reason: (err as Error).message,
        },
      });
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, WEATHER_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  const d = state.env?.data;
  const n = (v: number | null, digits = 0) => (v === null ? "—" : v.toFixed(digits));

  return (
    <section className="wr-panel" aria-labelledby="wr-wx-h">
      <header className="wr-panel-head">
        <h2 id="wr-wx-h">Weather &amp; air</h2>
        <span className={`wr-state is-${state.phase}`}>
          <i aria-hidden="true" />
          {state.phase === "loading" ? "polling" : state.phase === "ok" ? "live" : "no feed"}
        </span>
      </header>

      {state.phase === "ok" && d ? (
        <>
          <div className="wr-wx-grid">
            <div className="wr-tally is-signal">
              <p className="wr-tally-value">
                {n(d.temperatureC, 1)}
                <span className="wr-tally-unit">°C</span>
              </p>
              <p className="wr-tally-label">Now</p>
            </div>
            <div className="wr-tally">
              <p className="wr-tally-value">
                {n(d.rainChanceNext24h)}
                <span className="wr-tally-unit">%</span>
              </p>
              <p className="wr-tally-label">Rain chance 24 h</p>
            </div>
            <div className="wr-tally">
              <p className="wr-tally-value">
                {n(d.rainNext24hMm, 1)}
                <span className="wr-tally-unit">mm</span>
              </p>
              <p className="wr-tally-label">Forecast 24 h</p>
            </div>
            <div className={`wr-tally${d.pm25 !== null && d.pm25 > 37.5 ? " is-warn" : ""}`}>
              <p className="wr-tally-value">
                {n(d.pm25, 1)}
                <span className="wr-tally-unit">µg/m³</span>
              </p>
              <p className="wr-tally-label">PM2.5</p>
            </div>
          </div>
          <p className="wr-panel-note">{d.attribution}.</p>
        </>
      ) : state.phase === "loading" ? (
        <p className="wr-panel-note">Polling the forecast models…</p>
      ) : (
        <div className="wr-degraded">
          <p className="wr-degraded-reason">{state.env?.reason ?? "Feed unavailable."}</p>
          <button type="button" className="wr-btn" onClick={() => void load()}>
            Retry now
          </button>
        </div>
      )}
      <p className="wr-panel-note">
        Forecast, not observation — where this disagrees with the gauge
        network beside it, the gauge is what happened.
      </p>
    </section>
  );
}

/* -------------------------------------------------------------- fires */

type NearestMonument = { id: string; name: string; km: number };

/** Great-circle distance, km — good enough at city scale, no library needed. */
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function FirePanel({
  monuments,
}: {
  /** Slim {id,name,lat,lon} tuples for the register's 311 precisely-located
      entries — passed as a prop rather than importing the 1.3 MB register
      file into this client component. Computed once, server-side, in
      page.tsx. */
  monuments: { id: string; name: string; lat: number; lon: number }[];
}) {
  const [state, setState] = useState<{ phase: "loading" | "ok" | "down"; env?: Envelope<FirePayload> }>({
    phase: "loading",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/live/fires", { headers: { accept: "application/json" } });
      const env = (await res.json()) as Envelope<FirePayload>;
      setState({ phase: env.ok ? "ok" : "down", env });
    } catch (err) {
      setState({
        phase: "down",
        env: { ok: false, fetchedAt: new Date().toISOString(), source: "/api/live/fires", reason: (err as Error).message },
      });
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, FIRE_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  const d = state.env?.data;

  // Nearest register monument to each detection — the "so what" the raw
  // hotspot list does not answer on its own. O(detections × 311); trivial
  // at VIIRS's actual detection density over one metro area.
  const nearest: NearestMonument[] = (d?.detections ?? []).map((f) => {
    let best: NearestMonument = { id: "", name: "", km: Infinity };
    for (const m of monuments) {
      const km = haversineKm(f.lat, f.lon, m.lat, m.lon);
      if (km < best.km) best = { id: m.id, name: m.name, km };
    }
    return best;
  });
  const closest = nearest.length ? nearest.reduce((a, b) => (b.km < a.km ? b : a)) : null;

  return (
    <section className="wr-panel" aria-labelledby="wr-fire-h">
      <header className="wr-panel-head">
        <h2 id="wr-fire-h">Active fires</h2>
        <span className={`wr-state is-${state.phase}`}>
          <i aria-hidden="true" />
          {state.phase === "loading" ? "polling" : state.phase === "ok" ? "live" : "no feed"}
        </span>
      </header>

      {state.phase === "ok" && d ? (
        d.detections.length === 0 ? (
          <>
            <p className="wr-panel-note">
              No VIIRS thermal-anomaly detections over Bangkok in the trailing 24 h.
            </p>
            <p className="wr-panel-note">
              A quiet feed is not proof of a quiet city: VIIRS catches open flame and
              large hot roofs, not a contained fire inside a shophouse. {d.attribution}.
            </p>
          </>
        ) : (
          <>
            <div className="wr-rain-row">
              <div className="wr-tally is-warn">
                <p className="wr-tally-value">{d.detections.length}</p>
                <p className="wr-tally-label">Detections, 24 h</p>
              </div>
              {closest ? (
                <div className="wr-tally is-warn">
                  <p className="wr-tally-value">
                    {closest.km.toFixed(1)}
                    <span className="wr-tally-unit">km</span>
                  </p>
                  <p className="wr-tally-label">Nearest to a register entry</p>
                  <p className="wr-tally-sub">
                    {/* The id is the register's own, so the operator can open
                        the monument's record without leaving the incident. */}
                    <a href={`/heritage/${closest.id}`}>{closest.name} ↗</a>
                  </p>
                </div>
              ) : null}
            </div>
            <p className="wr-panel-note">
              {d.source}, {d.attribution}. A thermal-anomaly detector, not a fire
              department — treat this as a lead to check, not a confirmed fire.
            </p>
          </>
        )
      ) : state.phase === "loading" ? (
        <p className="wr-panel-note">Polling NASA FIRMS…</p>
      ) : (
        <div className="wr-degraded">
          <p className="wr-degraded-reason">{state.env?.reason ?? "Feed unavailable."}</p>
          <p className="wr-panel-note">
            Checked against the register&apos;s {monuments.length} precisely-located
            monuments once live — Bangkok&apos;s oldest protected stock is wood-frame
            construction in narrow lanes, the fabric a single ignition spreads
            fastest through.
          </p>
          <button type="button" className="wr-btn" onClick={() => void load()}>
            Retry now
          </button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------- camera rail */

/* One camera tile. The player is a facade: a proxied still plus a play
   control, and the YouTube iframe is only constructed once someone asks
   for it. That keeps four live streams from decoding at once, and keeps
   Google out of the page until a viewer opts in. */
function CuratedTile({ cam }: { cam: CuratedCamera }) {
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const located = isLocated(cam);

  // A link-only camera is one whose operator does not licence its player
  // for embedding. The tile sends the viewer to them rather than taking
  // the stream.
  if (cam.kind === "link") {
    return (
      <figure className="wr-cam wr-cam-yt is-linkonly">
        <a className="wr-cam-play" href={cam.sourceUrl} target="_blank" rel="noreferrer">
          <span className="wr-cam-nosnap">
            <span>watch at the operator ↗</span>
          </span>
        </a>
        <figcaption>
          <b>{cam.place ?? cam.title}</b>
          <small>
            {cam.district} · {cam.precision} precision · not embeddable
          </small>
          <a href={cam.sourceUrl} target="_blank" rel="noreferrer">
            source ↗
          </a>
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className={`wr-cam wr-cam-yt${located ? "" : " is-unlocated"}`}>
      {playing ? (
        <iframe
          className="wr-cam-frame"
          src={embedFor(cam.videoId)}
          title={cam.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          className="wr-cam-play"
          onClick={() => setPlaying(true)}
          aria-label={`Play live stream: ${cam.title}`}
        >
          {posterFailed ? (
            <span className="wr-cam-nosnap">
              <span>live · press to play</span>
            </span>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={posterFor(cam.videoId)}
              alt=""
              loading="lazy"
              onError={() => setPosterFailed(true)}
            />
          )}
          {/* The fallback text already reads "press to play"; a glyph on
              top of it collides. Only shown over a real poster. */}
          {posterFailed ? null : (
            <span className="wr-cam-playicon" aria-hidden="true">
              ▶
            </span>
          )}
        </button>
      )}
      <figcaption>
        <b>{cam.place ?? "Location not confirmed"}</b>
        <small>{located ? `${cam.district} · ${cam.precision} precision` : cam.title}</small>
        <a href={cam.sourceUrl} target="_blank" rel="noreferrer">
          source ↗
        </a>
        {!located ? <SuggestLocation cam={cam} /> : null}
      </figcaption>
    </figure>
  );
}

export function CctvRail() {
  const [state, setState] = useState<{ phase: "loading" | "ok" | "down"; env?: Envelope<CctvPayload> }>({
    phase: "loading",
  });
  const [nonce, setNonce] = useState(0);
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch("/api/live/cctv", { headers: { accept: "application/json" } });
        const env = (await res.json()) as Envelope<CctvPayload>;
        if (live) setState({ phase: env.ok ? "ok" : "down", env });
      } catch (err) {
        if (live)
          setState({
            phase: "down",
            env: {
              ok: false,
              fetchedAt: new Date().toISOString(),
              source: "/api/live/cctv",
              reason: (err as Error).message,
            },
          });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Snapshot cache-buster for agency stills. Paused when the tab is hidden
  // so a backgrounded war room is not quietly pulling images all afternoon.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setNonce((n) => n + 1);
    }, CAM_REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const fetched = state.env?.data?.cameras ?? [];
  const total = CURATED_CAMERAS.length + fetched.length;

  const scroll = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="wr-panel wr-cctv" aria-labelledby="wr-cctv-h">
      <header className="wr-panel-head">
        <h2 id="wr-cctv-h">Cameras</h2>
        <span className={`wr-state is-${total ? "ok" : "idle"}`}>
          <i aria-hidden="true" />
          {total} live
        </span>
        {CAMERA_TALLY.unconfirmed > 0 ? (
          <span className="wr-panel-meta">
            {CAMERA_TALLY.located} located · {CAMERA_TALLY.unconfirmed} awaiting a location
          </span>
        ) : null}
        {total > 3 ? (
          <span className="wr-rail-nav">
            <button type="button" className="wr-btn is-icon" onClick={() => scroll(-1)} aria-label="Scroll cameras left">
              ←
            </button>
            <button type="button" className="wr-btn is-icon" onClick={() => scroll(1)} aria-label="Scroll cameras right">
              →
            </button>
          </span>
        ) : null}
      </header>

      <div className="wr-rail" ref={railRef}>
        {CURATED_CAMERAS.map((c) => (
          <CuratedTile key={c.id} cam={c} />
        ))}
        {fetched.map((c) => (
          <figure key={c.id} className="wr-cam">
            {c.snapshotUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`${c.snapshotUrl}${c.snapshotUrl.includes("?") ? "&" : "?"}_=${nonce}`}
                alt={`Live view: ${c.name}`}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).classList.add("is-broken");
                }}
              />
            ) : (
              <div className="wr-cam-nosnap">
                <span>no snapshot endpoint</span>
              </div>
            )}
            <figcaption>
              <b>{c.name}</b>
              {c.district ? <small>{c.district}</small> : null}
              {c.streamUrl || c.pageUrl ? (
                <a href={(c.streamUrl ?? c.pageUrl)!} target="_blank" rel="noreferrer">
                  {c.streamUrl ? "live stream ↗" : "open ↗"}
                </a>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="wr-panel-note">
        Streams play on demand: the rail shows a still proxied through this
        site, and no request reaches Google until you press play — the same
        rule the weather feed follows. Add agency cameras by setting{" "}
        <code>CCTV_SOURCE_URL</code> on the Worker; they appear beside these.
      </p>
    </section>
  );
}
