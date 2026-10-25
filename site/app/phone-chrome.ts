/** Parent-viewport phone chrome. Keep in step with the shell @media in globals.css.
 *  An 844×390 phone matches the second clause. A 1440×900 desktop matches neither.
 *  The embedded map must follow the shell viewport, not its own frame: a Thai
 *  masthead makes the iframe a few dozen pixels shorter than the English one. */
export const PHONE_CHROME_MQ =
  "(max-width: 760px), (max-height: 500px) and (max-width: 1000px)";

/** Media query against the shell viewport when this document is framed. */
export function phoneChromeMedia(): MediaQueryList {
  let view: Window = window;
  try {
    if (window.parent !== window) {
      // Same-origin shell: read the parent viewport. Cross-origin throws.
      void window.parent.document;
      view = window.parent;
    }
  } catch {
    view = window;
  }
  return view.matchMedia(PHONE_CHROME_MQ);
}
