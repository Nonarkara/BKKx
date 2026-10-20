// Stable data path -> its content-addressed, immutably cached copy.
// See scripts/publish-immutable-data.mjs. A path not in the list is
// returned as is, so an unlisted file still loads (just without the cache win).
import DATA_URLS from "./data-urls.json";

const FILES: Record<string, string> = DATA_URLS.files;

export function dataUrl(path: string): string {
  return FILES[path] ?? path;
}
