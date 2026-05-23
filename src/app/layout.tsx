import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
