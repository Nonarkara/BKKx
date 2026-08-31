"use client";

import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CuratedCamera } from "../data/cctv-cameras";

/* A click-to-place location picker for cameras with no confirmed position.
 *
 * Adapted from bilawalsidhu/gods-eye-view's camera-calibration idea —
 * "positions are published; poses are estimated priors you calibrate by
 * dragging a gizmo" — right-sized for what this project actually needs and
 * actually has. That codebase calibrates full 3D pose (heading, pitch) on a
 * photorealistic globe with a live write-back. This is a static site with
 * no writable backend beyond D1 pageviews, and the location this project
 * needs is a single lat/lon point, not an orientation.
 *
 * So the tool does the minimum that respects both constraints: a normal
 * slippy map, one click to drop a marker, and two outputs — a copyable
 * suggestion and a prefilled GitHub issue — neither of which writes
 * anything. A human still reviews and commits, exactly like every other
 * location in this file. Turning "someone who notices will let me know"
 * into a two-click action, without weakening the rule that got the
 * placeholder markers here in the first place: an unreviewed guess must
 * never become a confirmed location.
 */

const STYLE = "https://tiles.openfreemap.org/styles/dark"; // matches AtlasView's OPENFREEMAP_DARK_STYLE

const REPO_ISSUES_NEW = "https://github.com/Nonarkara/BKKx/issues/new";

function buildSuggestion(cam: CuratedCamera, lat: number, lon: number): string {
  return [
    `Camera location suggestion`,
    `Stream: ${cam.sourceUrl}`,
    `Video id: ${cam.videoId || "(link-only camera)"}`,
    `Suggested coordinate: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    `(Click-placed on the war room map — please describe what's visible in the frame that confirms this.)`,
  ].join("\n");
}

function githubIssueUrl(cam: CuratedCamera, lat: number, lon: number): string {
  const params = new URLSearchParams({
    title: `Camera location: ${cam.id}`,
    body: buildSuggestion(cam, lat, lon) + "\n\n",
    labels: "data-correction",
  });
  return `${REPO_ISSUES_NEW}?${params}`;
}

export function SuggestLocation({ cam }: { cam: CuratedCamera }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    let disposed = false;

    void (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (disposed || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: STYLE,
        center: [100.5018, 13.7563], // Bangkok — same nominal reference as PLACEHOLDER_MARKER
        zoom: 11,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

      map.on("click", (e) => {
        const { lat, lng } = e.lngLat;
        setPicked({ lat, lon: lng });
        setCopied(false);
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new maplibre.Marker({ color: "#c9ff38" }).setLngLat([lng, lat]).addTo(map);
        }
      });
    })();

    return () => {
      disposed = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) {
    return (
      <button type="button" className="wr-suggest-trigger" onClick={() => setOpen(true)}>
        Suggest a location
      </button>
    );
  }

  return (
    <div className="wr-suggest-panel">
      <p className="wr-suggest-hint">
        Click where the camera actually is. Nothing is saved automatically —
        this only prepares a suggestion for a human to review.
      </p>
      <div ref={containerRef} className="wr-suggest-map" role="img" aria-label="Click to place a suggested location" />
      <div className="wr-suggest-actions">
        <button
          type="button"
          className="wr-btn"
          disabled={!picked}
          onClick={() => {
            if (!picked) return;
            navigator.clipboard
              .writeText(buildSuggestion(cam, picked.lat, picked.lon))
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })
              .catch(() => {});
          }}
        >
          {copied ? "✓ copied" : "Copy suggestion"}
        </button>
        {picked ? (
          <a className="wr-btn" href={githubIssueUrl(cam, picked.lat, picked.lon)} target="_blank" rel="noreferrer">
            File a GitHub issue ↗
          </a>
        ) : null}
        <button type="button" className="wr-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {picked ? (
        <p className="wr-suggest-coord">
          {picked.lat.toFixed(5)}, {picked.lon.toFixed(5)}
        </p>
      ) : null}
    </div>
  );
}
