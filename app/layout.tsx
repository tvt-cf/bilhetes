import type { Metadata, Viewport } from "next";
import { Cutive_Mono, Instrument_Sans, Montserrat } from "next/font/google";
import { HashScroll } from "@/components/site/hash-scroll";
import "./globals.css";

// fontes da marca: Montserrat nos títulos e no texto corrido, Cutive Mono nos detalhes datilografados
const sans = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], style: ["normal", "italic"] });
const mono = Cutive_Mono({ variable: "--font-cutive-mono", subsets: ["latin"], weight: "400" });
// só o "Bilhetes." do hero usa a Instrument Sans
const display = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], weight: "600" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Bilhetes — Seu ritual para viver maior",
  description: "Uma caixa viva com bilhetes que encontram você na hora exata. Feita à mão, em tiragem limitada.",
  openGraph: {
    title: "Bilhetes",
    description: "Seu ritual para viver maior.",
    images: ["/images/oraculo-6.jpg"],
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F0EB",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}
    >
      <body className="min-h-full font-sans">
        {children}
        <HashScroll />
      </body>
    </html>
  );
}
