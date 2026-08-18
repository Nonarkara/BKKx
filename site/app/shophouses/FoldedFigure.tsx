"use client";

import { useState, type ReactNode } from "react";

// Three of the essay's figures are catalogues — a schema table, five project
// cards, a findings list — that run to 1,200–1,400 px inside the reading
// column. They belong to the argument, but at that height they stop the
// reader rather than serve them. This caps a catalogue figure at a readable
// height and offers the rest on request. Argument diagrams stay unfolded.

const CATALOGUE = new Set(["tenure", "projects", "research", "timeline", "corridor"]);

export function FoldedFigure({ id, children }: { id: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!CATALOGUE.has(id)) return <>{children}</>;
  return (
    <div className={`sh-fold${open ? " is-open" : ""}`}>
      <div className="sh-fold-body">{children}</div>
      {!open && <div className="sh-fold-fade" aria-hidden="true" />}
      <button
        type="button"
        className="sh-fold-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Show less" : "Show the whole figure"}
      </button>
    </div>
  );
}
