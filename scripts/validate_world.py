#!/usr/bin/env python3

"""Validate the structural integrity of a Minecraft Java Anvil world."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path


SECTOR_BYTES = 4096
HEADER_BYTES = SECTOR_BYTES * 2


def fail(message: str) -> None:
    raise ValueError(message)


def validate_region(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if len(data) < HEADER_BYTES or len(data) % SECTOR_BYTES:
        fail(f"{path.name}: invalid region file size {len(data)}")

    chunk_count = 0
    allocated_sectors = len(data) // SECTOR_BYTES
    for index in range(1024):
        raw = struct.unpack_from(">I", data, index * 4)[0]
        sector_offset = raw >> 8
        sector_count = raw & 0xFF
        if sector_offset == 0 and sector_count == 0:
            continue
        if sector_offset < 2 or sector_count == 0:
            fail(f"{path.name}: invalid location entry {index}")
        if sector_offset + sector_count > allocated_sectors:
            fail(f"{path.name}: chunk {index} points outside the file")

        chunk_start = sector_offset * SECTOR_BYTES
        chunk_length = struct.unpack_from(">I", data, chunk_start)[0]
        if chunk_length < 1 or chunk_length + 4 > sector_count * SECTOR_BYTES:
            fail(f"{path.name}: invalid chunk length at entry {index}")
        chunk_count += 1

    return chunk_count, allocated_sectors


def main() -> int:
    if len(sys.argv) != 2:
        print(f"Usage: {Path(sys.argv[0]).name} WORLD_DIRECTORY", file=sys.stderr)
        return 2

    world = Path(sys.argv[1]).resolve()
    for required in ("level.dat", "region"):
        if not (world / required).exists():
            fail(f"missing required world entry: {required}")

    metadata_path = world / "metadata.json"
    if metadata_path.exists():
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        required_keys = {
            "minMcX", "maxMcX", "minMcZ", "maxMcZ",
            "minGeoLat", "maxGeoLat", "minGeoLon", "maxGeoLon",
            "projection", "scale",
        }
        missing = sorted(required_keys - metadata.keys())
        if missing:
            fail(f"metadata.json missing keys: {', '.join(missing)}")

    total_chunks = 0
    total_sectors = 0
    regions = sorted((world / "region").glob("r.*.*.mca"))
    if not regions:
        fail("no Anvil region files found")

    for region in regions:
        chunks, sectors = validate_region(region)
        total_chunks += chunks
        total_sectors += sectors

    print(
        f"OK: {world.name}: {len(regions)} regions, "
        f"{total_chunks} chunks, {total_sectors} sectors"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)

