#!/bin/sh

set -eu

usage() {
  echo "Usage: $0 ratchathewi|historic-core" >&2
  exit 2
}

[ "$#" -eq 1 ] || usage

case "$1" in
  ratchathewi)
    source_name="bangkok-ratchathewi-java"
    install_name="BKKx-Ratchathewi"
    archive_name="BKKx-Ratchathewi-Java-1.21.4.zip"
    ;;
  historic-core)
    source_name="bangkok-historic-core-java"
    install_name="BKKx-Historic-Core"
    archive_name="BKKx-Bangkok-Historic-Core-Java-1.21.4.zip"
    ;;
  *)
    usage
    ;;
esac

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(dirname -- "$script_dir")
source_dir="$project_dir/worlds/$source_name"
saves_dir="$HOME/Library/Application Support/minecraft/saves"
destination="$saves_dir/$install_name"

if [ -e "$destination" ]; then
  echo "Refusing to overwrite existing save: $destination" >&2
  exit 1
fi

if [ ! -f "$source_dir/level.dat" ]; then
  if ! command -v curl >/dev/null 2>&1 || ! command -v unzip >/dev/null 2>&1; then
    echo "curl and unzip are required to download the world release." >&2
    exit 1
  fi

  install_tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/bkkx-install.XXXXXX")
  trap 'rm -rf -- "$install_tmp_dir"' EXIT HUP INT TERM
  release_url="https://github.com/Nonarkara/BKKx/releases/latest/download/$archive_name"

  echo "Downloading $archive_name..."
  curl -fL "$release_url" -o "$install_tmp_dir/$archive_name"
  unzip -q "$install_tmp_dir/$archive_name" -d "$install_tmp_dir"
  source_dir="$install_tmp_dir/$source_name"
fi

if [ ! -f "$source_dir/level.dat" ]; then
  echo "Downloaded archive does not contain a valid Minecraft world." >&2
  exit 1
fi

mkdir -p "$saves_dir"
cp -R "$source_dir" "$destination"
echo "Installed: $destination"
