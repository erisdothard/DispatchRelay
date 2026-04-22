import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DispatchRelay — AI voice system for small carriers",
  description:
    "DispatchRelay handles broker check calls for small trucking carriers so your dispatcher can book more loads. Built by Syntra AI.",
  metadataBase: new URL("https://dispatchrelay.com"),
  openGraph: {
    title: "DispatchRelay — AI voice system for small carriers",
    description:
      "AI voice system that handles inbound broker check calls for your fleet.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
