import { Fragment, type ReactNode } from "react";

// Chicago-style notes. Block text carries [[n]] markers; this turns them into
// superscript links to the notes list at the foot of the piece. Kept as a
// plain function rather than a component so both the screen essay and the
// print page can use it without dragging client state along.

const MARKER = /\[\[(\d+)\]\]/g;

export function withNotes(text: string, hrefBase = "#note-"): ReactNode {
  if (!text.includes("[[")) return text;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MARKER.lastIndex = 0;
  while ((m = MARKER.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const n = m[1];
    out.push(
      <sup key={`${n}-${m.index}`} className="sh-noteref">
        <a href={`${hrefBase}${n}`} id={`ref-${n}`} aria-label={`Note ${n}`}>
          {n}
        </a>
      </sup>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

/** Strip markers for contexts that cannot carry them (alt text, meta). */
export function stripNotes(text: string): string {
  return text.replace(MARKER, "");
}
