import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bkk.nonarkara.org"),
  title: {
    default: "BKKx — Bangkok, block by block",
    template: "%s · BKKx",
  },
  description:
    "Explore Bangkok block by block through open, playable Minecraft city worlds.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "BKKx",
    title: "BKKx — Bangkok, block by block",
    description:
      "Walk through Bangkok as an open, playable Minecraft city atlas.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BKKx — Bangkok, block by block",
    description:
      "Walk through Bangkok as an open, playable Minecraft city atlas.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#11120f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        {children}
      </body>
    </html>
  );
}
