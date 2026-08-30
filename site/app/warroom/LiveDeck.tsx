"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Camera, RainPayload, WeatherPayload } from "../../worker/live";

/* The live half of the war room: the clock, the gauge network, and the
   camera rail. Everything here degrades to a stated reason rather than a
   number — an operator who cannot tell "no rain" from "no feed" is worse
   off than one with no panel at all. */

type Envelope<T> = { ok: boolean; fetchedAt: string; source: string; data?: T; reason?: string };
type CctvPayload = { cameras: Camera[]; cameraCount: number; configured: boolean };

const RAIN_POLL_MS = 300_000; // matches the edge TTL — polling faster only hits cache
const CAM_REFRESH_MS = 30_000;
const WEATHER_POLL_MS = 900_000; // matches the edge TTL

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

/* ------------------------------------------------------- camera rail */
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

  // Snapshot cache-buster. Paused when the tab is hidden so a backgrounded
  // war room is not quietly pulling images all afternoon.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setNonce((n) => n + 1);
    }, CAM_REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const cams = state.env?.data?.cameras ?? [];
  const configured = state.env?.data?.configured ?? false;

  const scroll = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="wr-panel wr-cctv" aria-labelledby="wr-cctv-h">
      <header className="wr-panel-head">
        <h2 id="wr-cctv-h">Cameras</h2>
        <span className={`wr-state is-${cams.length ? "ok" : state.phase === "loading" ? "loading" : "idle"}`}>
          <i aria-hidden="true" />
          {state.phase === "loading"
            ? "checking"
            : cams.length
              ? `${cams.length} online`
              : "no source"}
        </span>
        {cams.length > 3 ? (
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

      {cams.length > 0 ? (
        <div className="wr-rail" ref={railRef}>
          {cams.map((c) => (
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
      ) : (
        <div className="wr-degraded">
          <p className="wr-degraded-reason">
            {configured
              ? "Camera registry reachable but returned no cameras."
              : state.phase === "down"
                ? (state.env?.reason ?? "Camera registry unreachable.")
                : "No camera registry configured."}
          </p>
          <p className="wr-panel-note">
            The rail is built and wired — it renders live snapshots, refreshes
            every 30&nbsp;seconds, pauses when this tab is hidden and scrolls as
            one line. It is empty because no camera endpoint has been verified
            for this deployment, and inventing one would put a broken tile on
            screen that looks like a working system. Set{" "}
            <code>CCTV_SOURCE_URL</code> on the Worker to a JSON registry of{" "}
            <code>{"{ id, name, district?, snapshotUrl?, pageUrl? }"}</code> and
            this fills on the next load.
          </p>
        </div>
      )}
    </section>
  );
}
