import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumepic Sales Dashboard",
  description: "Dashboard profesional para ventas de fotografias en Lumepic"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {children}
        <Script
          id="tfjs"
          src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"
          strategy="beforeInteractive"
        />
        <Script
          id="coco-ssd"
          src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd"
          strategy="beforeInteractive"
        />
        <Script
          id="face-detection"
          src="https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
