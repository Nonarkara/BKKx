// Request-boundary portion of PR12, without its persistent raw-IP limiter.
// Origin checks reduce browser abuse; they are not authentication or a spend cap.
const MAX_BYTES = 4096;
const ORIGINS = new Set([
  "https://bkk.nonarkara.org",
  "https://bkkx-site.drnon.workers.dev",
]);

type PageviewRequest =
  | { ok: true; path: string; referrer: string | null }
  | { ok: false; response: Response };

function reject(status: number, error: string): PageviewRequest {
  return { ok: false, response: Response.json({ ok: false, error }, {
    status, headers: { "cache-control": "no-store" },
  }) };
}

function origin(value: string | null): string | null {
  if (!value || value === "null") return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.origin : null;
  } catch { return null; }
}

export async function readPageviewRequest(request: Request): Promise<PageviewRequest> {
  const allowed = new Set(ORIGINS);
  const url = new URL(request.url);
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) allowed.add(url.origin);
  // An explicit untrusted Origin must never fall back to a trusted Referer.
  const source = request.headers.has("origin")
    ? origin(request.headers.get("origin"))
    : origin(request.headers.get("referer"));
  if (!source || !allowed.has(source) || request.headers.get("sec-fetch-site") === "cross-site") {
    return reject(403, "Page views are only accepted from this site.");
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return reject(415, "Expected application/json.");
  }
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_BYTES) return reject(413, "Page view body is too large.");
  const reader = request.body?.getReader();
  if (!reader) return reject(400, "Expected a page view object.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  let value: unknown;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) {
        void reader.cancel().catch(() => {});
        return reject(413, "Page view body is too large.");
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch { return reject(400, "Expected a page view object."); }
  finally { reader.releaseLock(); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return reject(400, "Expected a page view object.");
  const body = value as { path?: unknown; referrer?: unknown };
  if (typeof body.path !== "string" || !body.path.startsWith("/") || body.path.startsWith("//") || body.path.includes("\\") || body.path.length > 512) {
    return reject(400, "Expected a local page path.");
  }
  if (body.referrer != null && typeof body.referrer !== "string") return reject(400, "Invalid referrer.");
  // Analytics does not need query strings, fragments, credentials or a visitor's
  // previous document path. Persist only the current pathname and referring origin.
  const path = new URL(body.path, "https://bkk.nonarkara.org").pathname;
  return { ok: true, path, referrer: origin(body.referrer as string | null) };
}
