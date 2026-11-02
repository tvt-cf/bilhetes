import Image from "next/image";
import Link from "next/link";
import { Eyebrow, Footer, MobileBuyBar, Nav } from "@/components/site/chrome";
import { PresaleForm, SubscribeForm, WaitlistForm } from "@/components/site/forms";
import { manifesto } from "@/lib/manifesto";
import { produto } from "@/lib/site";
import { getStock } from "@/lib/stock";

const cores = [
  ["Verdade", "#5B1F2E", "text-leveza"],
  ["Presença", "#7A8154", "text-leveza"],
  ["Intuição", "#D6ABAA", "text-verdade"],
  ["Coragem", "#C4533A", "text-leveza"],
  ["Recomeço", "#39515A", "text-leveza"],
  ["Leveza", "#FFFFFF", "text-verdade"],
  ["Luz", "#CBA86A", "text-verdade"],
] as const;

const ritual = ["Faça uma pausa", "Tire uma carta com intenção", "Saboreie o que precisa ouvir"];

const faixa = [
  ["/images/oraculo-228.jpg", "Mãos abrindo o Oráculo"],
  ["/images/oraculo-144.jpg", "Pessoa lendo um bilhete"],
  ["/images/oraculo-52.jpg", "Bilhetes coloridos sobre a grama"],
  ["/images/oraculo-186.jpg", "Pausa em meditação"],
] as const;

export default async function Home() {
  const { soldOut } = await getStock();
  return (
    <>
      <Nav />
      <main>
        <Hero soldOut={soldOut} />
        <ManifestoSection />
        <Oraculo />
        <Ritual />
        <Comprar soldOut={soldOut} />
        <Movimento />
      </main>
      <Footer />
      <MobileBuyBar />
    </>
  );
}

function Hero({ soldOut }: { soldOut: boolean }) {
  return (
    <section className="flex flex-col items-center px-5 pt-16 text-center md:px-16 md:pt-24">
      {soldOut ? (
        <span className="flex items-center gap-2.5 rounded-full bg-coragem px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.12em] text-white md:text-xs">
          ESGOTADO · {produto.edicao.toUpperCase()}
        </span>
      ) : (
        <span className="flex items-center gap-2.5 rounded-full border border-verdade/25 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-verdade md:text-xs">
          <span className="size-1.5 rounded-full bg-coragem" />
          {produto.edicao.toUpperCase()} · {produto.tiragem} CAIXAS
          <span className="hidden sm:inline"> NUMERADAS À MÃO</span>
        </span>
      )}
      <h1 className="mt-8 font-serif text-[92px] leading-none tracking-[-0.03em] text-tinta md:mt-9 md:text-[168px]">
        {produto.nome}.
      </h1>
      <p className="font-serif text-[30px] italic leading-tight text-verdade md:text-[44px]">{produto.slogan}</p>
      <p className="mt-6 max-w-[620px] text-[17px] leading-relaxed text-tinta-suave md:mt-7 md:text-[21px]">
        Uma caixa viva em madeira natural e {produto.bilhetes} bilhetes que encontram você na hora exata. Feita à mão,
        em tiragem limitada.
      </p>
      <Link
        href="#comprar"
        className="mt-9 flex h-15 w-full items-center justify-center gap-2.5 rounded-full bg-verdade px-12 text-[17px] font-semibold text-leveza transition active:scale-[0.98] hover:bg-verdade/90 sm:mt-10 sm:w-auto"
      >
        {soldOut ? "Entrar na fila de espera" : "Eu quero"} <span aria-hidden>→</span>
      </Link>
      {soldOut && (
        <p className="mt-5 text-sm text-tinta-suave">
          Avisamos pelo WhatsApp quando o próximo lote estiver disponível.
        </p>
      )}
      <Link href="/manifesto" className="mt-7 flex items-center gap-1.5 text-[15px] font-medium text-verdade">
        Ler o manifesto <span aria-hidden>→</span>
      </Link>
      <div className="relative -mx-5 mt-14 h-[480px] w-[calc(100%+2.5rem)] max-w-[1312px] overflow-hidden rounded-t-[28px] md:mx-0 md:mt-18 md:h-[760px] md:w-full">
        <Image
          src="/images/oraculo-228.jpg"
          alt="Mãos abrindo o Oráculo: a tampa de madeira gravada “toda grande mudança começa pequena.” sobre a caixa com o livreto bordô"
          fill
          priority
          sizes="(min-width: 1312px) 1312px, 100vw"
          className="object-cover object-[50%_45%]"
        />
      </div>
    </section>
  );
}

function ManifestoSection() {
  const corpo = [manifesto.estrofes.slice(1, 3), manifesto.estrofes.slice(3, 6)];
  return (
    <section className="bg-verdade px-5 py-24 md:px-24 md:py-36">
      <div className="mx-auto flex max-w-[1248px] flex-col gap-14 lg:flex-row lg:gap-24">
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-[20px] lg:aspect-[520/760] lg:w-[520px]">
          <Image
            src="/images/manifesto.jpg"
            alt="Mulher dança descalça com um grande tecido verde abrindo-se como asas"
            fill
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col pt-6">
          <div className="flex items-center gap-3.5">
            <span className="h-px w-10 bg-luz" />
            <Eyebrow className="text-luz">MANIFESTO</Eyebrow>
          </div>
          <h2 className="mt-9 font-serif text-5xl leading-[1.02] tracking-[-0.02em] text-leveza md:text-[76px]">
            {manifesto.abertura}
          </h2>
          <p className="mt-7 whitespace-pre-line font-serif text-2xl italic leading-snug text-intuicao md:text-[30px]">
            {manifesto.estrofes[0]}
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-12">
            {corpo.map((coluna, i) => (
              <div key={i} className="flex flex-col gap-5">
                {coluna.map((t) => (
                  <p key={t} className="text-base leading-[1.65] text-leveza/75">
                    {t.replace(/\n/g, " ")}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-14 h-px bg-leveza/15" />
          <div className="mt-10 flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div className="flex min-w-0 flex-col gap-3">
              <p className="whitespace-pre-line font-serif text-[28px] leading-tight text-luz xl:whitespace-pre xl:text-[29px]">
                {manifesto.fecho}
              </p>
              <p className="font-mono text-[15px] text-leveza/60">{manifesto.assinatura}</p>
            </div>
            <Link
              href="/manifesto"
              className="flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-full border border-leveza/40 px-6 py-3.5 text-[15px] font-medium text-leveza transition hover:bg-leveza/10 xl:self-auto"
            >
              Manifesto completo <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Oraculo() {
  return (
    <section id="oraculo" className="scroll-mt-20 px-5 py-24 md:px-24 md:py-36">
      <div className="mx-auto flex max-w-[1248px] flex-col gap-18">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-5">
            <Eyebrow className="text-coragem">O ORÁCULO · {produto.edicao.toUpperCase()}</Eyebrow>
            <h2 className="font-serif text-6xl leading-none tracking-[-0.02em] md:text-[84px]">
              Pequena por fora.
              <br />
              Imensa por dentro.
            </h2>
          </div>
          <p className="max-w-[440px] text-lg leading-relaxed text-tinta-suave">
            Cada caixa é feita à mão em madeira natural, com a tampa gravada e fecho magnético. Dentro,{" "}
            {produto.bilhetes} bilhetes e o livreto do ritual — para quando faltarem palavras, ou apenas coragem para
            escutá-las.
          </p>
        </div>

        <div className="flex flex-col gap-5 md:h-[640px] md:flex-row">
          <div className="relative h-[520px] overflow-hidden rounded-3xl md:h-auto md:w-[540px] md:shrink-0">
            <Image
              src="/images/oraculo-154.jpg"
              alt="Mãos espalhando bilhetes coloridos sobre uma mesa de madeira"
              fill
              sizes="(min-width: 768px) 540px, 100vw"
              className="object-cover"
            />
            <span className="absolute bottom-9 left-9 rounded-full bg-leveza/90 px-4 py-2.5 font-mono text-xs text-tinta">
              {produto.bilhetes} bilhetes em sete cores · livreto do ritual
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-5">
            <div className="flex flex-1 flex-col justify-between gap-10 rounded-3xl bg-presenca p-9">
              <span className="font-serif text-[120px] leading-[0.9] text-leveza">{produto.bilhetes}</span>
              <p className="max-w-sm leading-normal text-leveza/85">
                bilhetes escritos por Gabriela e Julia, a partir das próprias descobertas.
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-10 rounded-3xl bg-[#EAE3DA] p-9">
              <span className="font-serif text-[56px] leading-none text-verdade">Nº 001/{produto.tiragem}</span>
              <p className="max-w-sm leading-normal text-tinta-suave">
                Tiragem única. Cada caixa é numerada e assinada. Quando acabar, acabou.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-7">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <h3 className="font-serif text-4xl">Sete cores. Sete estados de espírito.</h3>
            <p className="font-hand text-[26px] text-verdade">Tire uma carta com intenção.</p>
          </div>
          <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
            {cores.map(([nome, cor, texto]) => (
              <li key={nome} className="flex w-[42vw] shrink-0 snap-start flex-col gap-3.5 sm:w-auto">
                <div
                  className={`flex h-[230px] items-end rounded-2xl p-5 sm:h-[250px] ${texto} ${nome === "Leveza" ? "border border-verdade/12" : ""}`}
                  style={{ background: cor }}
                >
                  <span className="font-script text-[28px]">bilhetes</span>
                </div>
                <span className="text-sm font-medium">{nome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Ritual() {
  return (
    <section id="ritual" className="scroll-mt-20 bg-noite pb-2 pt-24 md:pt-32">
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-14 px-5 md:px-24 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-6">
          <Eyebrow className="text-luz">O RITUAL</Eyebrow>
          <h2 className="font-serif text-6xl leading-none tracking-[-0.02em] text-leveza md:text-[84px]">
            Três gestos.
            <br />
            Toda manhã.
          </h2>
          <p className="max-w-[420px] text-lg leading-relaxed text-leveza/80">
            Quando faltarem palavras, ou apenas coragem para escutá-las.
          </p>
        </div>
        <div className="w-full lg:w-[520px]">
          <ol>
            {ritual.map((passo, i) => (
              <li key={passo} className="flex items-center gap-6 border-t border-leveza/20 py-4.5">
                <span className="w-9 font-hand text-[34px] text-intuicao">{i + 1}.</span>
                <span className="font-mono text-[19px] text-leveza">{passo}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 font-hand text-[26px] text-luz">Repita toda manhã, ou sempre que precisar.</p>
        </div>
      </div>
      <div className="mt-16 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-2 px-2 [scrollbar-width:none] md:mt-22 md:grid md:grid-cols-4 md:overflow-visible">
        {faixa.map(([src, alt]) => (
          <div key={src} className="relative h-[440px] w-[78vw] shrink-0 snap-start overflow-hidden rounded-md md:h-[460px] md:w-auto">
            <Image src={src} alt={alt} fill sizes="(min-width: 768px) 25vw, 78vw" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Comprar({ soldOut }: { soldOut: boolean }) {
  const itens = [
    ["Madeira natural", "Feita à mão, peça a peça"],
    [`${produto.bilhetes} bilhetes`, "Sete cores, frases gravadas"],
    ["Numerada", "Assinada pelas autoras"],
    ["Livreto do ritual", "Para começar sem pressa"],
  ];
  return (
    <section id="comprar" className="scroll-mt-20 px-5 py-24 text-center md:px-24 md:py-30">
      <div className="mx-auto flex max-w-[1248px] flex-col items-center">
        <Eyebrow className="text-coragem">
          {produto.edicao.toUpperCase()} · {soldOut ? "ESGOTADA" : "COMPRA ONLINE"}
        </Eyebrow>
        <h2 className="mt-6 font-serif text-[44px] leading-[1.05] tracking-[-0.02em] md:text-[72px]">
          {soldOut ? "Esgotou. O próximo lote já está a caminho." : `Apenas ${produto.tiragem} Oráculos. Um deles é seu.`}
        </h2>
        <ul className="mt-14 grid w-full grid-cols-2 gap-y-8 border-y border-verdade/15 py-8 md:grid-cols-4">
          {itens.map(([titulo, desc]) => (
            <li key={titulo} className="flex flex-col items-center gap-1.5">
              <span className="text-[17px] font-medium">{titulo}</span>
              <span className="text-sm text-tinta-suave">{desc}</span>
            </li>
          ))}
        </ul>
        {soldOut ? (
          <>
            <p className="mt-14 max-w-md text-lg leading-relaxed text-tinta-suave">
              Cada caixa é feita à mão, então os lotes são pequenos. Deixe seu nome e WhatsApp: você fica na fila e
              recebe o aviso antes de todo mundo.
            </p>
            <div className="mt-10 w-full">
              <WaitlistForm />
            </div>
          </>
        ) : (
          <>
            <div className="mt-14 flex flex-col items-center gap-1">
              <span className="font-serif text-[44px] leading-none">{produto.precoAVista}</span>
              <span className="text-[15px] text-tinta-suave">ou {produto.parcelas}</span>
              <span className="mt-1.5 text-[13px] text-tinta-suave">{produto.frete}</span>
            </div>
            <div className="mt-10 w-full">
              <PresaleForm />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Movimento() {
  return (
    <section id="movimento" className="scroll-mt-20 bg-areia px-5 py-24 md:px-24 md:py-36">
      <div className="mx-auto flex max-w-[1248px] flex-col items-center gap-16 lg:flex-row lg:gap-24">
        <div className="flex flex-1 flex-col">
          <Eyebrow className="text-verdade">O MOVIMENTO</Eyebrow>
          <h2 className="mt-6 font-serif text-5xl leading-[1.02] tracking-[-0.02em] md:text-[72px]">
            Um bilhete por semana, <br className="hidden sm:block" />
            na hora exata.
          </h2>
          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-tinta-suave">
            Faça parte do movimento. Deixe seu WhatsApp para receber mensagens de sabedoria e ser a primeira pessoa a
            saber dos próximos encontros.
          </p>
          <div className="mt-11">
            <SubscribeForm />
          </div>
        </div>
        <ChatPreview />
      </div>
    </section>
  );
}

function ChatPreview() {
  return (
    <div
      aria-hidden
      className="flex w-full max-w-[440px] flex-col gap-3.5 rounded-[32px] bg-leveza p-7 shadow-[0_30px_60px_rgba(91,31,46,0.12)]"
    >
      <div className="flex items-center gap-3 border-b border-verdade/10 pb-3.5">
        <span className="flex size-11 items-center justify-center rounded-full bg-verdade font-script text-3xl text-luz">
          b
        </span>
        <div>
          <p className="text-[15px] font-semibold">bilhetes.co</p>
          <p className="text-xs text-tinta-suave">comunidade</p>
        </div>
      </div>
      <Bubble time="segunda · 07:00">
        <span className="font-serif text-2xl leading-snug text-verdade">Bom dia. O silêncio também é resposta.</span>
      </Bubble>
      <Bubble time="quarta · 07:00">
        <span className="text-[15px] leading-snug">
          Hoje, antes de qualquer tela: uma pausa de três respirações. Só isso.
        </span>
      </Bubble>
      <div className="flex w-[340px] max-w-full items-center gap-3 rounded-[4px_18px_18px_18px] bg-recomeco px-4 py-3.5 text-sm text-leveza">
        <span className="text-luz">✦</span>
        Novo encontro da comunidade em breve. Você recebe o convite aqui.
      </div>
    </div>
  );
}

function Bubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="flex w-[340px] max-w-full flex-col gap-2 rounded-[4px_18px_18px_18px] bg-white px-4.5 py-4">
      {children}
      <span className="text-[11px] text-[#9a938c]">{time}</span>
    </div>
  );
}
