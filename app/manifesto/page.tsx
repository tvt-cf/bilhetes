import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow, Footer, MobileBuyBar, Nav } from "@/components/site/chrome";
import { manifesto } from "@/lib/manifesto";

export const metadata: Metadata = {
  title: "Manifesto · bilhetes",
  description: manifesto.abertura,
};

export default function ManifestoPage() {
  return (
    <>
      <Nav />
      <main className="bg-verdade text-leveza">
        <section className="mx-auto flex max-w-[1248px] flex-col gap-12 px-5 pb-24 pt-10 md:px-8 md:py-36 lg:flex-row lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:h-fit lg:w-[440px] lg:shrink-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] lg:aspect-[3/4]">
              <Image
                src="/images/manifesto.jpg"
                alt="Mulher dança descalça com um grande tecido verde abrindo-se como asas"
                fill
                priority
                sizes="(min-width: 1024px) 440px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <article className="flex flex-col">
            <div className="flex items-center gap-3.5">
              <span className="h-px w-10 bg-luz" />
              <Eyebrow className="text-luz">MANIFESTO</Eyebrow>
            </div>
            <h1 className="mt-9 text-[44px] leading-[1.05] tracking-[-0.02em] md:text-[68px]">
              {manifesto.abertura}
            </h1>
            <div className="mt-14 flex flex-col gap-9">
              {manifesto.estrofes.map((estrofe, i) => (
                <p
                  key={i}
                  className={`whitespace-pre-line ${
                    i === 0
                      ? "text-[22px] italic leading-snug text-intuicao md:text-[26px]"
                      : "max-w-[620px] text-lg leading-[1.7] text-leveza/80"
                  }`}
                >
                  {estrofe}
                </p>
              ))}
            </div>
            <p className="mt-14 whitespace-pre-line text-[28px] leading-tight text-luz md:text-[34px]">
              {manifesto.fecho}
            </p>
            <div className="mt-14 border-t border-leveza/15 pt-10 font-mono text-leveza/70">
              <p className="text-xl">{manifesto.assinatura}</p>
              <p className="mt-1">{manifesto.convite}</p>
            </div>
            <Link
              href="/#comprar"
              className="mt-12 self-start rounded-full bg-leveza px-8 py-4 font-medium text-verdade transition hover:bg-white"
            >
              Conhecer os Bilhetes →
            </Link>
          </article>
        </section>
      </main>
      <Footer />
      <MobileBuyBar />
    </>
  );
}
