#!/usr/bin/env python3
"""Shared Minecraft block-frame arithmetic.

Projection and scanline fill used by every world-pipeline builder. One
copy, so a fencepost fix cannot land in the monuments and miss the
shophouses. 1 block = 1 metre; Minecraft north is -Z.

Tests import this module the same way they import the builders.
"""
from __future__ import annotations

import math
from typing import Iterable


def project(lat: float, lon: float, world: dict) -> tuple[float, float]:
    """Linear local projection. `world` is a heritage-register worlds[] entry."""
    x = (lon - world["bounds"]["minLon"]) / (
        world["bounds"]["maxLon"] - world["bounds"]["minLon"]
    ) * world["blocks"]["maxX"]
    z = (world["bounds"]["maxLat"] - lat) / (
        world["bounds"]["maxLat"] - world["bounds"]["minLat"]
    ) * world["blocks"]["maxZ"]
    return x, z


def row_spans(ring: list[tuple[float, float]]) -> list[list[int]]:
    """Scanline-fill a polygon ring into [z, x_start, x_end] spans, inclusive.

    Even-odd rule, sampling each row at its centre (z + 0.5) so a block is
    filled when its middle is inside the polygon rather than when its corner
    grazes an edge. Block column x covers [x, x+1), so a column is filled when
    its centre falls between the two crossings — ceil(xa - 0.5) .. floor(xb - 0.5).
    The naive round(xa)..round(xb) is one block too wide on every row.
    """
    if len(ring) < 3:
        return []
    zs = [p[1] for p in ring]
    z_lo, z_hi = int(min(zs)), int(max(zs))
    spans: list[list[int]] = []
    for z in range(z_lo, z_hi + 1):
        y = z + 0.5
        xs: list[float] = []
        for i in range(len(ring)):
            x1, z1 = ring[i]
            x2, z2 = ring[(i + 1) % len(ring)]
            if (z1 > y) == (z2 > y):
                continue
            xs.append(x1 + (y - z1) / (z2 - z1) * (x2 - x1))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            a = math.ceil(xs[i] - 0.5)
            b = math.floor(xs[i + 1] - 0.5)
            if b >= a:
                spans.append([z, a, b])
    return spans


def span_volume(spans: list[list[int]], layers: int) -> int:
    return sum((b - a + 1) for _, a, b in spans) * layers


def columns_of(spans: Iterable[list[int]]) -> set[tuple[int, int]]:
    return {(x, z) for z, a, b in spans for x in range(a, b + 1)}


def punch_spans(spans: list[list[int]], blocked: set[tuple[int, int]]) -> list[list[int]]:
    """Drop blocked columns from spans, splitting rows where needed."""
    if not blocked or not spans:
        return spans
    out: list[list[int]] = []
    for z, a, b in spans:
        x = a
        while x <= b:
            if (x, z) in blocked:
                x += 1
                continue
            start = x
            while x <= b and (x, z) not in blocked:
                x += 1
            out.append([z, start, x - 1])
    return out


def keep_spans(spans: list[list[int]], keep: set[tuple[int, int]]) -> list[list[int]]:
    """Keep only columns that are in `keep`."""
    if not spans:
        return []
    out: list[list[int]] = []
    for z, a, b in spans:
        x = a
        while x <= b:
            if (x, z) not in keep:
                x += 1
                continue
            start = x
            while x <= b and (x, z) in keep:
                x += 1
            out.append([z, start, x - 1])
    return out


def outer_ring(geom: dict) -> list[list[float]]:
    c = geom["coordinates"]
    while isinstance(c[0][0], list):
        c = c[0]
    return c


def min_oriented_rect(pts: list[tuple[float, float]]) -> dict | None:
    """Minimum-area bounding rectangle of a ring in the same units as `pts`.

    Returns frontage (short side), depth (long side), the frontage-min /
    depth-min origin, and unit axes. None if the ring is degenerate.
    """
    best = None
    for i in range(len(pts) - 1):
        dx, dy = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]
        length = math.hypot(dx, dy)
        if length < 1e-9:
            continue
        ux, uy = dx / length, dy / length
        px, py = -uy, ux
        us = [p[0] * ux + p[1] * uy for p in pts]
        vs = [p[0] * px + p[1] * py for p in pts]
        u0, u1 = min(us), max(us)
        v0, v1 = min(vs), max(vs)
        w, h = u1 - u0, v1 - v0
        area = w * h
        if best is None or area < best[0]:
            best = (area, w, h, ux, uy, px, py, u0, v0)
    if best is None:
        return None
    _, w, h, ux, uy, px, py, u0, v0 = best
    origin = (ux * u0 + px * v0, uy * u0 + py * v0)
    if w <= h:
        return {
            "frontage_m": w,
            "depth_m": h,
            "fu": ux, "fv": uy,
            "du": px, "dv": py,
            "origin": origin,
        }
    return {
        "frontage_m": h,
        "depth_m": w,
        "fu": px, "fv": py,
        "du": ux, "dv": uy,
        "origin": origin,
    }


def rect_ring(
    origin: tuple[float, float],
    fu: float, fv: float, du: float, dv: float,
    f0: float, f1: float, d0: float, d1: float,
) -> list[tuple[float, float]]:
    """Axis-aligned (in the building frame) rectangle as a ring."""
    def pt(along_f: float, along_d: float) -> tuple[float, float]:
        return (
            origin[0] + fu * along_f + du * along_d,
            origin[1] + fv * along_f + dv * along_d,
        )
    return [pt(f0, d0), pt(f1, d0), pt(f1, d1), pt(f0, d1)]
