import Link from "next/link";

// The shared masthead of the heritage register pages (home, areas, walks).
// The Minecraft-facing pages (/worlds, /atlas) keep their own dark chrome.
export function PlaceMasthead() {
  return (
    <header className="register-masthead">
      <Link className="register-wordmark" href="/" aria-label="BKKxC(ulture) home">
        <span>BKK</span>
        <b>x</b>
        <em>C(ulture)</em>
      </Link>
      <nav className="register-nav" aria-label="Primary navigation">
        <Link href="/heritage#quarters">Quarters</Link>
        <Link href="/heritage#walks">Walks</Link>
        <Link href="/heritage#register">Register</Link>
        <Link href="/about">About</Link>
        <a href="https://github.com/Nonarkara/BKKx" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </header>
  );
}
