import type { Metadata, Viewport } from "next";
import { Jost, Prompt, Source_Serif_4 } from "next/font/google";
import { LocaleProvider } from "./i18n/LocaleContext";
import "./globals.css";

// Two interface faces: Jost for Latin, non-looped Prompt for Thai.
// next/font emits local assets; readers do not contact Google's font service.
const latin = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  fallback: ["Prompt"],
  display: "swap",
});
const thai = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// The essay body on /shophouses only. Axiom Design Core §XV Editorial calls
// for a serif "for the body of the piece", which the rest of this site
// cannot use — its reading matter is ~90% Thai and every serif-adjacent Thai
// face carries the looped head banned workspace-wide. The studio essay is
// English, so retain its earned reading face as a scoped exception to the
// two-family interface rule. It is not used for map controls or numbers.
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bkk.nonarkara.org"),
  title: {
    default: "BKKxC(ulture) — Bangkok's heritage, monument by monument",
    template: "%s · BKKxC(ulture)",
  },
  description:
    "Every registered ancient monument in Bangkok, mapped from the Fine Arts Department register — and the Minecraft worlds that let you walk them.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "BKKxC(ulture)",
    title: "BKKxC(ulture) — Bangkok's heritage, block by block",
    description:
      "Walk through Bangkok's heritage as an open, playable 3D atlas.",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BKKxC(ulture) — Bangkok's heritage, block by block",
    description:
      "Walk through Bangkok's heritage as an open, playable 3D atlas.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f2ec",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables go on <html>, not <body>. globals.css declares
    // --font-body/--font-display on :root, and a custom property is
    // substituted using the element it is declared on — so a --font-* living
    // one level down on <body> is invisible to it, the whole chain computes
    // to nothing, and everything silently falls back to system-ui.
    <html lang="en" className={`${latin.variable} ${thai.variable} ${serif.variable}`}>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
