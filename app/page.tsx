import { CreditCard, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow, Footer, MobileBuyBar, Nav } from "@/components/site/chrome";
import { PresaleForm, SubscribeForm, WaitlistForm } from "@/components/site/forms";
import { PixIcon } from "@/components/site/pix-icon";
import { manifesto } from "@/lib/manifesto";
import { produto } from "@/lib/site";
import { getStock } from "@/lib/stock";

const cores = [
  ["verdade", "#5B1F2E", "text-leveza"],
  ["presença", "#7A8154", "text-leveza"],
  ["intuição", "#D6ABAA", "text-[#3A111B]"],
  ["coragem", "#C4533A", "text-leveza"],
  ["recomeço", "#39515A", "text-leveza"],
  ["leveza", "#FFFFFF", "text-[#3A111B]"],
  ["luz", "#CBA86A", "text-[#3A111B]"],
] as const;

const ritual = ["Faça uma pausa", "Escolha um bilhete com intenção", "Viva o que ele desperta em você"];

const faixa = [
  ["/images/oraculo-186.jpg", "Mulher meditando sentada no chão, perto das samambaias"],
  ["/images/ritual-caixa-listrado.jpg", "Caixa de madeira gravada sobre um tecido listrado, ao lado de uma vela"],
  ["/images/oraculo-144.jpg", "Pessoa lendo um bilhete"],
  ["/images/ritual-poltrona.jpg", "Mulher numa poltrona verde segura um bilhete junto ao peito"],
] as const;

export default async function Home() {
  const { soldOut } = await getStock();
  return (
    <>
      <Nav />
      <main>
        <Hero soldOut={soldOut} />
        <Assinatura />
        <Ritual />
        <ManifestoSection />
        <Bilhetes />
        <Criadoras />
        <JeitoCerto soldOut={soldOut} />
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
        <span className="flex items-center gap-2.5 rounded-full bg-coragem px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white">
          ESGOTADO · {produto.edicao.toUpperCase()}
        </span>
      ) : (
        <span className="flex items-center gap-2.5 rounded-full border border-verdade/25 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-verdade">
          <span className="size-1.5 rounded-full bg-coragem" />
          {produto.edicao.toUpperCase()} · {produto.tiragem} CAIXAS
          <span className="hidden sm:inline"> NUMERADAS À MÃO</span>
        </span>
      )}
      <h1 className="mt-8 font-display text-[72px] font-semibold leading-none tracking-[-0.04em] text-tinta md:mt-9 md:text-[clamp(88px,8.6vw,128px)]">
        {produto.nome}.
      </h1>
      <p className="mt-3 font-mono text-[20px] leading-tight text-verdade md:text-[clamp(22px,1.9vw,28px)]">{produto.slogan}</p>
      <p className="mt-5 max-w-[620px] text-base leading-relaxed text-tinta-suave md:max-w-none md:whitespace-nowrap md:text-[17px]">
        Uma caixa viva com {produto.bilhetes} bilhetes que encontram você na hora exata.
      </p>
      <Link
        href="#comprar"
        className="mt-9 flex h-15 w-full items-center justify-center gap-2.5 rounded-full bg-verdade px-12 text-base font-semibold text-leveza transition active:scale-[0.98] hover:bg-verdade/90 sm:mt-10 sm:w-auto"
      >
        {soldOut ? "Entrar na fila de espera" : "Eu quero"} <span aria-hidden>→</span>
      </Link>
      {soldOut && (
        <p className="mt-5 text-sm text-tinta-suave">
          Avisamos pelo WhatsApp quando o próximo lote estiver disponível.
        </p>
      )}
      <div className="relative -mx-5 mt-14 h-[480px] w-[calc(100%+2.5rem)] overflow-hidden rounded-t-[28px] md:mx-auto md:mt-12 md:aspect-[4/3] md:h-auto md:w-full md:max-w-[var(--largura)]">
        <Image
          src="/images/oraculo-228.jpg"
          alt="Mãos abrindo a caixa: a tampa de madeira gravada “toda grande mudança começa pequena.” sobre a caixa com o livreto bordô"
          fill
          priority
          sizes="(min-width: 1200px) 1200px, 100vw"
          className="object-cover object-[50%_40%]"
        />
      </div>
    </section>
  );
}

// Faixa curta entre o hero e o ritual, alinhada às bordas da foto.
function Assinatura() {
  return (
    <div className="mx-auto flex flex-wrap justify-center md:max-w-[calc(var(--largura)+8rem)] gap-x-6 gap-y-1.5 px-5 py-7 text-xs text-tinta-suave md:justify-between md:px-16 md:text-[13px]">
      {["Feito à mão, com intenção", "Produção em pequenos lotes", "Criado para atravessar o tempo"].map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}

function Ritual() {
  return (
    <section id="ritual" className="scroll-mt-20 bg-vinho pb-2 pt-24 md:px-16 md:pb-[clamp(48px,6svh,96px)] md:pt-[clamp(56px,8svh,112px)]">
      {/* fotos verticais como no canvas, na largura comum das seções */}
      <div className="largura">
      <div className="flex flex-col justify-between gap-14 px-5 md:px-0 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-6">
          <Eyebrow className="text-luz">O RITUAL</Eyebrow>
          <h2 className="max-w-[560px] text-[40px] leading-[1.08] tracking-[-0.02em] text-leveza md:text-[clamp(34px,3.1vw,46px)]">
            Uma pausa para o que realmente importa.
          </h2>
        </div>
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <ol>
            {ritual.map((passo, i) => (
              <li key={passo} className="flex items-center gap-6 border-t border-leveza/20 py-4.5">
                <span className="w-9 font-hand text-[22px] text-intuicao">{i + 1}.</span>
                <span className="font-mono text-[17px] text-leveza">{passo}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 font-hand text-[17px] text-luz">Volte sempre que precisar.</p>
        </div>
      </div>
      <div className="mt-16 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-2 px-2 [scrollbar-width:none] md:px-0 md:mt-[clamp(40px,6svh,80px)] md:grid md:grid-cols-4 md:overflow-visible">
        {faixa.map(([src, alt]) => (
          <div key={src} className="relative h-[440px] w-[78vw] shrink-0 snap-start overflow-hidden rounded-md md:aspect-[346/460] md:h-auto md:w-auto">
            <Image src={src} alt={alt} fill sizes="(min-width: 768px) 360px, 78vw" className="object-cover" />
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

function ManifestoSection() {
  return (
    <section className="bg-[#F6F4EF] px-5 py-24 md:px-16 md:py-[clamp(56px,8svh,112px)]">
      <div className="largura flex flex-col gap-10">
        <div className="flex flex-col gap-2.5">
          <Eyebrow className="text-recomeco">MANIFESTO</Eyebrow>
          <span className="h-px w-14 bg-recomeco" />
        </div>
        <div className="flex flex-col gap-1 text-[30px] font-medium leading-[1.08] tracking-[-0.025em] md:text-[clamp(30px,3.2vw,46px)]">
          <p className="text-[#2A1A1D]">{manifesto.abertura}</p>
          <p className="whitespace-pre-line text-[#A79C93]">{manifesto.estrofes[0]}</p>
          <p className="text-verdade">
            Muitas vezes as respostas já estão com a gente, mas precisamos silenciar os ruídos para conseguir ouvir.
          </p>
        </div>
        <div className="relative h-[200px] overflow-hidden rounded-[20px] md:aspect-[4/1] md:h-auto">
          <Image
            src="/images/manifesto-tecido.jpg"
            alt="Tecido terracota translúcido voando contra o céu nublado"
            fill
            sizes="(min-width: 1248px) 1248px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function Bilhetes() {
  return (
    <section id="bilhetes" className="scroll-mt-20 bg-[#EBE7DF] px-5 py-24 md:px-16 md:py-[clamp(56px,8svh,112px)]">
      <div className="largura flex flex-col items-center gap-12">
        <div className="flex max-w-[720px] flex-col items-center gap-4 text-center">
          <Eyebrow className="text-verdade">O ORÁCULO</Eyebrow>
          <h2 className="text-[40px] font-medium leading-[1.04] tracking-[-0.025em] text-[#1F1517] md:text-[clamp(34px,3.1vw,46px)]">
            Sua caixa mágica
            <br />
            de Bilhetes.
          </h2>
          <p className="text-base leading-[1.65] text-[#6E645D]">
            Os Bilhetes nasceram das nossas descobertas e da vontade de que outras pessoas também reconheçam seus
            desejos, se escutem e vivam com mais coragem.
          </p>
        </div>

        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-4 md:aspect-[1225/640] md:flex-row">
            <div className="relative h-[460px] overflow-hidden rounded-[28px] md:h-auto md:flex-1">
              <Image
                src="/images/oraculo-154.jpg"
                alt="Mãos espalhando bilhetes coloridos sobre uma mesa de madeira"
                fill
                sizes="(min-width: 768px) 765px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-7 pt-28 md:p-8 md:pt-32">
                <h3 className="text-xl font-medium tracking-[-0.03em] text-white">Bilhetes para lembrar.</h3>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-[24px] bg-verdade p-7 md:w-[36%] md:p-8">
              <p className="text-sm font-medium text-luz">Caixa viva</p>
              <h3 className="text-[21px] font-medium leading-[1.15] tracking-[-0.02em] text-leveza md:text-[22px]">
                Feita à mão, em madeira natural. Nenhuma caixa é igual à outra.
              </h3>
              <div className="relative mt-2 min-h-[240px] flex-1 overflow-hidden rounded-2xl md:min-h-0">
                <Image
                  src="/images/caixas-empilhadas.jpg"
                  alt="Caixas de madeira em tons diferentes, empilhadas"
                  fill
                  sizes="(min-width: 768px) 352px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:aspect-[1225/333] md:flex-row">
            <div className="flex flex-col gap-6 rounded-[24px] bg-[#F6F4EF] p-7 md:flex-1 md:p-8">
              <h3 className="text-[21px] font-medium tracking-[-0.02em] text-[#1F1517] md:text-[22px]">
                Cada cor, uma intenção.
              </h3>
              <ul className="grid grid-cols-4 gap-2 md:flex-1 md:grid-cols-7 md:gap-2.5">
                {cores.map(([nome, cor, texto]) => (
                  <li
                    key={nome}
                    className={`flex h-[110px] items-end rounded-xl p-2.5 md:h-auto md:min-h-0 md:p-3 ${texto} ${nome === "leveza" ? "border border-verdade/12" : ""}`}
                    style={{ background: cor }}
                  >
                    <span className="font-mono text-[11px] md:text-[13px]">{nome}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-between gap-8 rounded-[24px] bg-recomeco p-7 md:w-[36%] md:p-8">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-luz">Produção limitada</p>
                <p className="font-mono text-5xl leading-none text-leveza md:text-[52px]">Nº 001</p>
              </div>
              <p className="text-[15px] leading-[1.6] text-leveza/80">
                Cada caixa da primeira edição é numerada e assinada à mão pelas criadoras. Quando acabar, acabou.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Criadoras() {
  return (
    <section id="criadoras" className="scroll-mt-20 bg-leveza px-5 py-24 md:px-16 md:py-[clamp(48px,6svh,104px)]">
      {/* colagem com as proporções do canvas */}
      <div className="largura flex flex-col gap-14 md:gap-[clamp(32px,6svh,72px)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-5">
            <Eyebrow className="text-tinta">CRIADORAS</Eyebrow>
            <h2 className="text-[40px] leading-none tracking-[-0.02em] text-verdade md:text-[clamp(34px,3.1vw,46px)]">
              A vida é a arte
              <br />
              do encontro.
            </h2>
          </div>
          <p className="font-hand text-[20px] text-verdade md:whitespace-nowrap md:text-[clamp(18px,1.6vw,24px)]">por Gabriela Lima &amp; Julia Lima Villa</p>
        </div>
        <div className="flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-[7%]">
          <div className="relative aspect-[640/700] w-full max-w-[640px] shrink-0 lg:w-[46%]">
            <div className="absolute left-0 top-0 h-[80%] w-[59.4%] overflow-hidden rounded-3xl">
              <Image
                src="/images/criadoras-jardim-pb.jpg"
                alt="Gabriela e Julia sentadas num pufe no jardim, em preto e branco"
                fill
                sizes="(min-width: 1024px) 384px, 60vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 h-[74.3%] w-[53.1%] overflow-hidden rounded-3xl ring-[10px] ring-leveza">
              <Image
                src="/images/criadoras-cadeiras.jpg"
                alt="Gabriela e Julia sentadas em cadeiras de vime entre as plantas"
                fill
                sizes="(min-width: 1024px) 340px, 53vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-2xl leading-[1.2] text-tinta md:text-[clamp(20px,1.7vw,24px)]">
              Somos amigas de longa data, mas foi buscando por algo novo que nossa história (re)começa.
            </p>
            <span className="h-px w-10 bg-luz" />
            <p className="text-[17px] leading-[1.65] text-[#4F4944]">
              Sempre trocamos bilhetes, dividimos a vida e coincidências raras. O sobrenome em comum, por exemplo, foi
              um desses presentes que a vida nos deu muito lá atrás. Nos tornamos irmãs por escolha e, agora, sócias.
            </p>
            <p className="text-[17px] leading-[1.65] text-[#4F4944]">
              Entre uma mensagem e outra, livros compartilhados e conexões improváveis, nasceram os bilhetes. Com eles,
              nasceu a vontade de abrir a roda. Começar pequeno, buscar junto.
            </p>
            <p className="font-hand text-lg leading-[1.5] text-verdade">
              Se estas cartas chegaram até você, talvez nossos caminhos tenham se encontrado exatamente quando
              precisavam &lt;3
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Legenda({ children }: { children: React.ReactNode }) {
  return <figcaption className="text-[11px] font-semibold tracking-[0.22em] text-tinta-suave">{children}</figcaption>;
}

function JeitoCerto({ soldOut }: { soldOut: boolean }) {
  return (
    <section className="bg-[#F6F4EF] px-5 py-24 md:px-16 md:py-[clamp(40px,6svh,96px)]">
      {/* as fotos mantêm a proporção do canvas */}
      <div className="largura flex flex-col gap-14 md:gap-[clamp(32px,5svh,72px)]">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end lg:gap-14">
          <div className="flex shrink-0 flex-col gap-5">
            <Eyebrow className="text-tinta-suave">NA SUA CASA</Eyebrow>
            <h2 className="text-[40px] leading-[1.08] tracking-[-0.025em] text-tinta md:text-[clamp(34px,3.1vw,46px)]">
              Não existe jeito certo,
              <br />
              existe o seu.
            </h2>
          </div>
          <div className="flex max-w-[360px] flex-col gap-4 text-[15px] leading-[1.65] text-[#4F4944] xl:text-base">
            <p>
              Nossas caixas são numeradas à mão, uma diferente da outra, para que cada um crie o seu próprio jeito de se
              escutar.
            </p>
            <p>
              Elas são lindas por si só e a gente adora ter elas na sala, no escritório, na penteadeira… Um pouco de
              intenção, um pouco de intuição.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-5">
          {/* no desktop a foto da sala acompanha a altura da coluna da direita */}
          <figure className="flex flex-col gap-3 lg:flex-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] lg:aspect-auto lg:flex-1">
              <Image
                src="/images/casa-sala.jpg"
                alt="Caixa sobre o aparador da sala, ao lado de um vaso de madeira e da vitrola"
                fill
                sizes="(min-width: 1024px) 570px, 100vw"
                className="object-cover"
              />
            </div>
            <Legenda>01 — NA SALA</Legenda>
          </figure>
          <div className="flex flex-col gap-6 lg:w-[42%] lg:shrink-0 lg:gap-5">
            <figure className="flex flex-col gap-3">
              <div className="relative aspect-[520/420] overflow-hidden rounded-[4px]">
                <Image
                  src="/images/casa-aparador.jpg"
                  alt="Caixa de madeira clara sobre o aparador, perto da vitrola"
                  fill
                  sizes="(min-width: 1024px) 450px, 100vw"
                  className="object-cover"
                />
              </div>
              <Legenda>02 — NO APARADOR</Legenda>
            </figure>
            <div className="flex gap-5">
              <figure className="flex flex-1 flex-col gap-3">
                <div className="relative aspect-[248/300] overflow-hidden rounded-[4px]">
                  <Image
                    src="/images/casa-escritorio.jpg"
                    alt="Três caixas de madeira empilhadas sobre a mesa"
                    fill
                    sizes="(min-width: 1024px) 215px, 50vw"
                    className="object-cover"
                  />
                </div>
                <Legenda>03 — NO ESCRITÓRIO</Legenda>
              </figure>
              {/* botão centralizado em relação à foto (desconta a altura da legenda) */}
              <div className="flex flex-1 items-center justify-center pb-7">
                <Link
                  href="#comprar"
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-full bg-verdade px-6 py-3.5 text-[15px] font-semibold text-leveza transition active:scale-[0.98] hover:bg-verdade/90 md:px-8 md:py-4"
                >
                  {soldOut ? "Fila de espera" : "Eu quero!"} <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
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
    <section id="comprar" className="scroll-mt-20 bg-vinho px-5 py-24 text-center text-leveza md:px-16 md:py-[clamp(56px,8svh,112px)]">
      <div className="largura flex flex-col items-center">
        <Eyebrow className="text-luz">
          {produto.edicao.toUpperCase()} · {soldOut ? "ESGOTADA" : "COMPRA ONLINE"}
        </Eyebrow>
        <h2 className="mt-6 text-[34px] leading-[1.1] tracking-[-0.02em] md:text-[clamp(34px,3.1vw,46px)]">
          {soldOut ? "Esgotou. O próximo lote já está a caminho." : `Apenas ${produto.tiragem} caixas de Bilhetes. Uma delas é sua.`}
        </h2>
        <ul className="mt-14 grid w-full grid-cols-2 gap-y-8 border-y border-leveza/20 py-8 md:grid-cols-4">
          {itens.map(([titulo, desc]) => (
            <li key={titulo} className="flex flex-col items-center gap-1.5">
              <span className="text-base font-medium">{titulo}</span>
              <span className="text-[13px] text-leveza/70">{desc}</span>
            </li>
          ))}
        </ul>
        {soldOut ? (
          <>
            <p className="mt-14 max-w-md text-[17px] leading-relaxed text-leveza/75">
              Cada caixa é feita à mão, então os lotes são pequenos. Deixe seu nome e WhatsApp: você fica na fila e
              recebe o aviso antes de todo mundo.
            </p>
            <div className="mt-10 w-full">
              <WaitlistForm tone="dark" />
            </div>
          </>
        ) : (
          <>
            <div className="mt-14 flex items-center justify-center gap-7">
              <div className="relative aspect-[4/3] w-[176px] shrink-0 overflow-hidden rounded-2xl ring-1 ring-leveza/15">
                <Image
                  src="/images/caixa-cartas-thumb.jpg"
                  alt="A caixa de madeira fechada ao lado de um leque de bilhetes coloridos"
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col items-start gap-1 text-left">
                <span className="text-[28px] leading-none md:text-[31px]">{produto.precoAVista}</span>
                <span className="text-sm text-leveza/70">ou {produto.parcelas}</span>
                <span className="mt-1.5 text-xs text-leveza/70">{produto.frete}</span>
              </div>
            </div>
            <div className="mt-10 w-full">
              <PresaleForm tone="dark" />
            </div>
            <PagamentoSeguro />
          </>
        )}
      </div>
    </section>
  );
}

// Selo discreto sob o botão de compra: forma de pagamento e quem processa.
function PagamentoSeguro() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-leveza/55">
      <span className="flex items-center gap-1.5">
        <Lock className="size-3.5" strokeWidth={1.75} aria-hidden /> Pagamento seguro
      </span>
      <span aria-hidden>·</span>
      <span className="flex items-center gap-1.5">
        <PixIcon className="size-3" /> Pix
      </span>
      <span className="flex items-center gap-1.5">
        <CreditCard className="size-3.5" strokeWidth={1.75} aria-hidden /> Cartão em até 10x
      </span>
      <span aria-hidden>·</span>
      <span>
        via <span className="font-semibold text-leveza/75">InfinitePay</span>
      </span>
    </div>
  );
}

function Movimento() {
  return (
    <section id="movimento" className="scroll-mt-20 bg-leveza px-5 py-24 md:px-16 md:py-[clamp(56px,8svh,112px)]">
      <div className="largura flex flex-col items-center gap-16 lg:flex-row lg:gap-24">
        <div className="flex flex-1 flex-col">
          <Eyebrow className="text-verdade">COMUNIDADE</Eyebrow>
          <h2 className="mt-6 text-[40px] leading-[1.05] tracking-[-0.02em] md:text-[clamp(34px,3.1vw,46px)]">
            Faça parte
            <br />
            do movimento.
          </h2>
          <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-tinta-suave">
            Deixe seu WhatsApp para ser convidado para o próximo evento e, de vez em quando, uma mensagem de sabedoria.
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
      className="flex w-full max-w-[440px] flex-col gap-3.5 rounded-[32px] border border-verdade/5 bg-leveza p-7 shadow-[0_30px_60px_rgba(91,31,46,0.12)]"
    >
      <div className="flex items-center gap-3 border-b border-verdade/10 pb-3.5">
        <span className="flex size-11 items-center justify-center rounded-full bg-verdade font-hand text-xl text-luz">
          b
        </span>
        <div>
          <p className="text-[15px] font-semibold">bilhetes.co</p>
          <p className="text-xs text-tinta-suave">comunidade</p>
        </div>
      </div>
      <Bubble>
        <span className="text-[15px] leading-snug">Bom dia. Seu bilhete de hoje:</span>
      </Bubble>
      <Bubble time="segunda · 07:02">
        <span className="text-[17px] leading-snug text-verdade">O silêncio também é resposta.</span>
      </Bubble>
      <div className="flex w-[340px] max-w-full items-center gap-3 rounded-[4px_18px_18px_18px] bg-recomeco px-4 py-3.5 text-sm text-leveza">
        <span className="text-luz">✦</span>
        Convite: Yoga Meditativa, esse sábado às 9h10 em São Paulo.
      </div>
    </div>
  );
}

function Bubble({ children, time }: { children: React.ReactNode; time?: string }) {
  return (
    <div className="flex w-[340px] max-w-full flex-col gap-2 rounded-[4px_18px_18px_18px] bg-white px-4.5 py-4">
      {children}
      {time && <span className="text-[11px] text-[#9a938c]">{time}</span>}
    </div>
  );
}
