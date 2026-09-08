import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Noto_Sans_SC, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { LocaleProvider } from "./i18n/LocaleContext";
import "./globals.css";

// Malay is Latin. IBM Plex Sans is the body face on this branch.
// Inter is banned workspace-wide.
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Simplified Chinese for the ZH locale. Noto Sans SC, never a looped display face.
const notoSc = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://klx.nonarkara.org"),
  title: {
    default: "KLXxC(ulture) — Kuala Lumpur's heritage, monument by monument",
    template: "%s · KLXxC(ulture)",
  },
  description:
    "National Heritage sites of Kuala Lumpur mapped from Jabatan Warisan Negara, plus the iconic towers as stacked 3D parts — an atlas for the mayors who have to see the city.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "KLXxC(ulture)",
    title: "KLXxC(ulture) — Kuala Lumpur's heritage, monument by monument",
    description:
      "Walk Kuala Lumpur's civic core, the Golden Triangle and the two-river confluence as an open 3D atlas.",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KLXxC(ulture) — Kuala Lumpur's heritage, monument by monument",
    description:
      "Walk Kuala Lumpur's civic core, the Golden Triangle and the two-river confluence as an open 3D atlas.",
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
    <html lang="en" className={`${plex.variable} ${notoSc.variable} ${mono.variable} ${serif.variable}`}>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
