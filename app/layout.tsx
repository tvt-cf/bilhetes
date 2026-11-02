import type { Metadata, Viewport } from "next";
import {
  Caveat,
  Courier_Prime,
  Instrument_Sans,
  Instrument_Serif,
  Mrs_Saint_Delafield,
} from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"] });
const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
// fontes de detalhe não entram no preload, para o primeiro carregamento ficar leve
const mono = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});
const hand = Caveat({ variable: "--font-caveat", subsets: ["latin"], preload: false });
const script = Mrs_Saint_Delafield({ variable: "--font-mrs-saint-delafield", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Oráculo · bilhetes — Um ritual para viver maior",
  description:
    "Uma caixa viva em madeira natural e 22 bilhetes que encontram você na hora exata. Feita à mão, em tiragem limitada.",
  openGraph: {
    title: "Oráculo · bilhetes",
    description: "Um ritual para viver maior.",
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
      className={`${sans.variable} ${serif.variable} ${mono.variable} ${hand.variable} ${script.variable} antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
