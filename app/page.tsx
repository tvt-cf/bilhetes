import Image from "next/image";
import Link from "next/link";
import { Eyebrow, Footer, MobileBuyBar, Nav } from "@/components/site/chrome";
import { PresaleForm, SubscribeForm } from "@/components/site/forms";
import { Logo } from "@/components/site/logo";
import { manifesto } from "@/lib/manifesto";
import { lancamento, produto } from "@/lib/site";

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

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ManifestoSection />
        <Oraculo />
        <Ritual />
        <Reserva />
        <Lancamento />
        <Movimento />
      </main>
      <Footer />
      <MobileBuyBar />
    </>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center px-5 pt-16 text-center md:px-16 md:pt-24">
      <span className="flex items-center gap-2.5 rounded-full border border-verdade/25 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-verdade md:text-xs">
        <span className="size-1.5 rounded-full bg-coragem" />
        {produto.edicao.toUpperCase()} · {produto.tiragem} CAIXAS
        <span className="hidden sm:inline"> NUMERADAS À MÃO</span>
      </span>
      <h1 className="mt-8 font-serif text-[92px] leading-none tracking-[-0.03em] text-tinta md:mt-9 md:text-[168px]">
        {produto.nome}.
      </h1>
      <p className="font-serif text-[30px] italic leading-tight text-verdade md:text-[44px]">{produto.slogan}</p>
      <p className="mt-6 max-w-[620px] text-[17px] leading-relaxed text-tinta-suave md:mt-7 md:text-[21px]">
        Uma caixa viva em madeira natural e {produto.bilhetes} bilhetes que encontram você na hora exata. Feita à mão,
        em tiragem limitada.
      </p>
      <div className="mt-9 flex w-full flex-col items-center gap-5 sm:mt-10 sm:w-auto sm:flex-row sm:gap-7">
        <Link
          href="#reserva"
          className="flex h-14 w-full items-center justify-center rounded-full bg-verdade px-8 font-medium text-leveza transition active:scale-[0.98] hover:bg-verdade/90 sm:w-auto"
        >
          Reservar o meu · {produto.preco}
        </Link>
        <Link href="/manifesto" className="flex items-center gap-1.5 font-medium text-verdade">
          Ler o manifesto <span aria-hidden>→</span>
        </Link>
      </div>
      <div className="relative -mx-5 mt-14 flex h-[480px] w-[calc(100%+2.5rem)] max-w-[1312px] justify-center overflow-hidden rounded-t-[28px] md:mx-0 md:mt-18 md:w-full bg-[radial-gradient(ellipse_at_50%_45%,#E6DFD5_0%,#D3C9BC_100%)] md:h-[760px]">
        <div className="absolute bottom-[40px] left-1/2 h-[70px] w-[440px] -translate-x-1/2 rounded-full bg-[#5A4A3A]/20 blur-[40px]" />
        <Image
          src="/images/oraculo-caixa-recorte.png"
          alt="O Oráculo: a caixa de madeira natural aberta, com o livreto bordô, e a tampa gravada “toda grande mudança começa pequena.”"
          width={935}
          height={1100}
          priority
          sizes="(min-width: 768px) 600px, 380px"
          className="relative mt-8 h-auto w-[340px] self-start md:mt-9 md:w-[595px]"
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
          <div className="mt-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-3">
              <p className="whitespace-pre-line font-serif text-[32px] leading-tight text-luz">{manifesto.fecho}</p>
              <p className="font-mono text-[15px] text-leveza/60">{manifesto.assinatura}</p>
            </div>
            <Link
              href="/manifesto"
              className="flex items-center gap-2 self-start rounded-full border border-leveza/40 px-6 py-3.5 text-[15px] font-medium text-leveza transition hover:bg-leveza/10 sm:self-auto"
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

function Reserva() {
  const itens = [
    ["Madeira natural", "Feita à mão, peça a peça"],
    [`${produto.bilhetes} bilhetes`, "Sete cores, frases gravadas"],
    ["Numerada", "Assinada pelas autoras"],
    ["Livreto do ritual", "Para começar sem pressa"],
  ];
  return (
    <section id="reserva" className="scroll-mt-20 px-5 py-24 text-center md:px-24 md:py-30">
      <div className="mx-auto flex max-w-[1248px] flex-col items-center">
        <Eyebrow className="text-coragem">{produto.edicao.toUpperCase()} · PRÉ-VENDA</Eyebrow>
        <h2 className="mt-6 font-serif text-[44px] leading-[1.05] tracking-[-0.02em] md:text-[72px]">
          Apenas {produto.tiragem} Oráculos. Um deles é seu.
        </h2>
        <ul className="mt-14 grid w-full grid-cols-2 gap-y-8 border-y border-verdade/15 py-8 md:grid-cols-4">
          {itens.map(([titulo, desc]) => (
            <li key={titulo} className="flex flex-col items-center gap-1.5">
              <span className="text-[17px] font-medium">{titulo}</span>
              <span className="text-sm text-tinta-suave">{desc}</span>
            </li>
          ))}
        </ul>
        <div className="mt-14 flex flex-col items-center gap-1">
          <span className="font-serif text-[44px] leading-none">{produto.preco}</span>
          <span className="text-sm text-tinta-suave">{produto.parcelamento}</span>
          <span className="text-[15px] font-semibold text-coragem">ou {produto.precoAVista}</span>
          <span className="mt-1.5 text-[13px] text-tinta-suave">{produto.frete}</span>
        </div>
        <div className="mt-10 w-full">
          <PresaleForm />
        </div>
      </div>
    </section>
  );
}

function Lancamento() {
  const fatos = [
    ["QUANDO", lancamento.data, lancamento.horario],
    ["ONDE", lancamento.local, lancamento.endereco],
    ["QUEM", `${lancamento.vagas} mulheres`, `Convidadas por ${lancamento.anfitrias}`],
  ];
  return (
    <section id="lancamento" className="scroll-mt-20 bg-recomeco px-5 py-24 md:px-24 md:py-36">
      <div className="mx-auto flex max-w-[1248px] flex-col gap-16">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-5">
            <Eyebrow className="text-luz">LANÇAMENTO · RSVP</Eyebrow>
            <h2 className="font-serif text-5xl leading-none tracking-[-0.02em] text-leveza md:text-[80px]">
              Seu bilhete para
              <br />o primeiro encontro.
            </h2>
          </div>
          <p className="max-w-[420px] text-lg leading-relaxed text-leveza/75">
            {lancamento.anfitrias} convidam para uma manhã de café, yoga e o ritual de lançamento dos Bilhetes. Apenas{" "}
            {lancamento.vagas} lugares — a confirmação acontece pelo lu.ma.
          </p>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[28px] bg-leveza lg:flex-row">
          <div className="relative h-80 lg:h-auto lg:w-[280px] lg:shrink-0">
            <Image
              src="/images/oraculo-184.jpg"
              alt="Gabriela e Julia abraçadas, sorrindo"
              fill
              sizes="(min-width: 1024px) 280px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col gap-8 p-8 md:p-11">
            <div className="flex items-start justify-between gap-4">
              <Logo className="text-xl text-verdade" />
              <span className="font-mono text-[13px] tracking-[0.12em] text-tinta-suave">ADMITE 1</span>
            </div>
            <dl className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-verdade/15">
              {fatos.map(([k, a, b]) => (
                <div key={k} className="flex flex-col gap-2 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <dt className="font-mono text-xs tracking-[0.17em] text-coragem">{k}</dt>
                  <dd className="font-serif text-[28px] leading-tight">{a}</dd>
                  <dd className="text-sm leading-snug text-tinta-suave">{b}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-verdade/15 pt-6">
              <p className="font-mono text-xs tracking-[0.17em] text-coragem">PROGRAMAÇÃO</p>
              <ul className="mt-3">
                {lancamento.programacao.map(([hora, o_que], i) => (
                  <li key={hora} className={`flex items-center gap-6 py-3 ${i ? "border-t border-verdade/8" : ""}`}>
                    <span className="w-14 shrink-0 font-serif text-[26px] text-verdade">{hora}</span>
                    <span className="font-mono text-[15px] sm:text-[17px]">{o_que}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            aria-hidden
            className="hidden w-0.5 bg-[repeating-linear-gradient(to_bottom,rgba(91,31,46,0.25)_0_8px,transparent_8px_18px)] lg:block"
          />
          <div className="flex flex-col justify-between gap-10 bg-verdade p-9 lg:w-80 lg:shrink-0">
            <div className="flex flex-col gap-2.5">
              <span className="font-serif text-[42px] text-leveza">{lancamento.vagas} lugares</span>
              <p className="leading-normal text-leveza/75">
                Uma manhã para abrir o Oráculo juntas, com quem também quer viver maior.
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              <a
                href={lancamento.lumaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-full bg-leveza px-6 py-4.5 font-semibold text-verdade transition hover:bg-white"
              >
                Confirmar presença <span aria-hidden>↗</span>
              </a>
              <span className="text-center font-mono text-xs text-leveza/60">RSVP via lu.ma</span>
            </div>
          </div>
        </div>
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
        Lançamento: {lancamento.dataCurta}, {lancamento.horario}. Garanta seu bilhete.
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
