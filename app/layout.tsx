import type { Metadata, Viewport } from "next";
import { Cutive_Mono, Instrument_Sans, Montserrat } from "next/font/google";
import { HashScroll } from "@/components/site/hash-scroll";
import { ValidacaoPt } from "@/components/site/validacao-pt";
import "./globals.css";

// fontes da marca: Montserrat nos títulos e no texto corrido, Cutive Mono nos detalhes datilografados
const sans = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], style: ["normal", "italic"] });
const mono = Cutive_Mono({ variable: "--font-cutive-mono", subsets: ["latin"], weight: "400" });
// só o "Bilhetes." do hero usa a Instrument Sans
const display = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], weight: "600" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Bilhetes — Seu Ritual para Viver Maior",
  description: "Uma caixa viva com bilhetes que encontram você na hora exata. Feita à mão, em tiragem limitada.",
  openGraph: {
    title: "Bilhetes",
    description: "Seu Ritual para Viver Maior.",
    // miniatura ao compartilhar o link: mãos abrindo a caixa (recorte 1200x630 da foto do hero)
    images: [
      {
        url: "/images/og-bilhetes.jpg",
        width: 1200,
        height: 630,
        alt: "Mãos abrindo a caixa de madeira com a tampa gravada “toda grande mudança começa pequena.”",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/images/og-bilhetes.jpg"] },
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
        <ValidacaoPt />
      </body>
    </html>
  );
}
