import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

// Une seule famille, minimaliste : Sora
const sora = Sora({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LUMONCORE — The Method",
  description: "Let's create & monetize. The Lumoncore method.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  // Plein écran sur iPhone (encoche) : les marges de sécurité sont gérées en CSS
  viewportFit: "cover",
};

/**
 * Layout racine du site formation.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      <body>{children}</body>
    </html>
  );
}
