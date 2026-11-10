import { CreditCard, Flame, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Eyebrow, Footer, MobileBuyBar, Nav } from "@/components/site/chrome";
import { Carrossel } from "@/components/site/carrossel";
import { CheckoutForm } from "@/components/site/checkout";
import { SubscribeForm, WaitlistForm } from "@/components/site/forms";
import { PixIcon } from "@/components/site/pix-icon";
import { produto } from "@/lib/site";
import type { BoxColor } from "@/lib/db/schema";
import { getStock } from "@/lib/stock";

// cada passo em duas partes: no celular quebra entre elas, no desktop fica numa linha
const ritual = [
  ["Respire e mentalize", "sem pressa"],
  ["Escolha um bilhete", "com intenção"],
  ["Viva o que ele", "desperta em você"],
] as const;

// "na sua casa": a caixa nos cantos da casa, na ordem do rascunho
const casa = [
  ["/images/casa-mesa-vidro.jpg", "Caixa de madeira sobre uma mesa de vidro, ao lado de um vaso de planta e de uma vela"],
  ["/images/casa-livro-dado.jpg", "Caixa de madeira sobre um livro de capa rosa, ao lado de um dado"],
  ["/images/casa-aparador.jpg", "Caixa de madeira no aparador, ao lado de um vaso de madeira e da vitrola"],
  ["/images/casa-tapete.jpg", "Duas caixas de madeira gravadas sobre um tapete colorido"],
] as const;

// fotos quadradas; o 3º item é o recorte vertical de cada cena (mãos e caixa, pulseiras inteiras, sem a saia, sem o gramado de cima)
const faixa = [
  ["/images/ritual-mesa.jpg", "As duas criadoras à mesa no jardim, uma delas lendo um bilhete tirado da caixa", "object-[50%_81%]"],
  ["/images/oraculo-144.jpg", "Pessoa lendo um bilhete", "object-[50%_90%]"],
  ["/images/ritual-poltrona.jpg", "Mulher numa poltrona verde segura um bilhete junto ao peito", "object-[50%_0%]"],
  ["/images/ritual-grama.jpg", "Leque de bilhetes coloridos e o livreto do ritual aberto sobre a grama, ao lado da tampa da caixa", "object-[50%_100%]"],
] as const;

export default async function Home() {
  const { soldOut, colorSoldOut } = await getStock();
  return (
    <>
      <Nav />
      <main>
        <Hero soldOut={soldOut} />
        <Assinatura />
        <Bilhetes />
        <Ritual />
        <Criadoras />
        <Comprar soldOut={soldOut} colorSoldOut={colorSoldOut} />
        <Movimento />
      </main>
      <Footer />
      <MobileBuyBar />
    </>
  );
}

function Hero({ soldOut }: { soldOut: boolean }) {
  return (
    <section className="flex flex-col items-center px-5 pt-11 text-center md:px-16 md:pt-9">
      {/* mesma tag com ou sem estoque: o esgotado aparece na seção de compra, não logo na entrada */}
      <span className="flex items-center gap-2 whitespace-nowrap rounded-full border border-verdade/25 px-3 py-1.5 text-[min(10px,2.9vw)] font-semibold tracking-[0.1em] text-verdade sm:gap-2.5 sm:px-3.5 sm:text-[11px] sm:tracking-[0.18em]">
        EDIÇÃO LIMITADA
        <span className="size-1.5 rounded-full bg-coragem" aria-hidden />
        CAIXAS NUMERADAS À MÃO
      </span>
      <h1 className="mt-8 font-display text-[72px] font-semibold leading-none tracking-[-0.04em] text-tinta md:mt-6 md:text-[clamp(88px,8.6vw,120px)]">
        {produto.nome}.
      </h1>
      <p className="mt-3 font-mono md:mt-3.5 text-[20px] leading-tight text-verdade md:text-[clamp(22px,1.9vw,28px)]">{produto.slogan}</p>
      <p className="mt-5 max-w-[620px] text-base leading-relaxed text-tinta-suave md:max-w-none md:whitespace-nowrap md:text-[17px]">
        Uma caixa viva com bilhetes que encontram você na hora exata.
      </p>
      <Link
        href="#comprar"
        className="mt-9 flex h-15 w-full items-center justify-center gap-2.5 rounded-full bg-verdade px-12 text-base font-semibold text-leveza transition active:scale-[0.98] hover:bg-verdade/90 sm:mt-10 sm:w-auto md:mt-[34px]"
      >
        {soldOut ? "Entrar na fila de espera" : "Eu quero"} <span aria-hidden>→</span>
      </Link>
      {soldOut && (
        <p className="mt-5 text-sm text-tinta-suave">
          Avisamos pelo WhatsApp quando o próximo lote estiver disponível.
        </p>
      )}
      <div className="relative -mx-5 mt-14 h-[480px] w-[calc(100%+2.5rem)] overflow-hidden rounded-t-[28px] md:mx-auto md:mt-10 md:aspect-[4/3] md:h-auto md:w-full md:max-w-[var(--largura)]">
        <Image
          src="/images/oraculo-228.jpg"
          alt="Mãos abrindo a caixa: a tampa de madeira gravada “toda grande mudança começa pequena.” sobre a caixa com o livreto bordô"
          fill
          priority
          sizes="(min-width: 1200px) 1200px, 100vw"
          className="object-cover object-[50%_48%]"
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
      <div className="flex flex-col justify-between gap-14 px-5 md:px-0 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-5">
          <Eyebrow className="text-luz">COMO USAR</Eyebrow>
          <h2 className="max-w-[560px] text-[40px] leading-[1.08] tracking-[-0.02em] text-leveza md:text-[clamp(34px,3.1vw,46px)]">
            A pausa
            <br />
            que faltava
            <br />
            no seu dia.
          </h2>
        </div>
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <ol>
            {ritual.map(([inicio, fim], i) => (
              <li key={inicio} className="flex items-center gap-6 border-b border-leveza/20 py-4.5">
                <span className="w-9 font-hand text-[22px] text-intuicao">{i + 1}.</span>
                <span className="font-mono text-[17px] text-leveza">
                  <span className="block md:inline">{inicio}</span> <span className="block md:inline">{fim}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4.5 font-hand text-[17px] text-luz">Volte sempre que precisar.</p>
        </div>
      </div>
      <Carrossel
        total={faixa.length}
        className="mt-16 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-2 px-2 [scrollbar-width:none] md:px-0 md:mt-[clamp(40px,6svh,80px)] md:grid md:grid-cols-4 md:overflow-visible"
      >
        {faixa.map(([src, alt, foco]) => (
          <div key={src} className="relative aspect-square w-[66vw] shrink-0 snap-start overflow-hidden rounded-md md:w-auto">
            <Image src={src} alt={alt} fill sizes="(min-width: 768px) 300px, 66vw" className={`object-cover ${foco}`} />
          </div>
        ))}
      </Carrossel>
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
            <div className="relative h-[460px] overflow-hidden rounded-md md:h-auto md:flex-1">
              <Image
                src="/images/oraculo-154.jpg"
                alt="Mãos espalhando bilhetes coloridos sobre uma mesa de madeira"
                fill
                sizes="(min-width: 768px) 765px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-7 pt-28 md:p-8 md:pt-32">
                <h3 className="text-[21px] font-medium leading-[1.25] tracking-[-0.02em] md:text-[22px] text-white">
                  Mensagens que <br className="md:hidden" />
                  abrem caminhos
                </h3>
              </div>
            </div>
            <div className="flex flex-col gap-8 rounded-md bg-[#8A5A3A] p-7 md:w-[36%] md:gap-10 md:p-9">
              <h3 className="text-[21px] font-medium leading-[1.25] tracking-[-0.02em] md:text-[22px] text-leveza">
                Feita à mão, em madeira natural. Nenhuma caixa é igual à outra.
              </h3>
              <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-md md:min-h-0">
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
          <div className="flex flex-col gap-6 pt-4 md:pt-7">
            <h3 className="text-[21px] font-medium leading-[1.25] tracking-[-0.02em] md:text-[22px] text-[#1F1517]">
              <span className="md:block">Para ter na sala, no escritório, na penteadeira.</span>{" "}
              <span className="md:block">Um pouco de intenção, um pouco de intuição.</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {casa.map(([src, alt]) => (
                <div key={src} className="relative aspect-[3/4] overflow-hidden rounded-md">
                  <Image src={src} alt={alt} fill sizes="(min-width: 768px) 300px, 50vw" className="object-cover" />
                </div>
              ))}
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
      <div className="largura @container flex flex-col gap-14 md:gap-[clamp(32px,6svh,72px)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-5">
            <Eyebrow className="text-tinta">CRIADORAS</Eyebrow>
            <h2 className="text-[40px] leading-none tracking-[-0.02em] text-verdade md:text-[clamp(34px,3.1vw,46px)]">
              A vida é a arte
              <br />
              do encontro.
            </h2>
          </div>
          {/* no desktop a assinatura ocupa a mesma largura da coluna de texto abaixo (52% = 100% − fotos 39% − espaço 9%) */}
          {/* sempre numa linha: no celular a fonte encolhe com a tela para caber */}
          <p className="whitespace-nowrap font-hand text-[min(20px,4vw)] text-verdade md:text-[clamp(18px,1.6vw,24px)] lg:w-[52%] lg:text-[2.2cqw]">
            por Gabriela Lima &amp; Julia Lima Villa
          </p>
        </div>
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:gap-[9%]">
          <div className="flex w-full max-w-[640px] shrink-0 gap-2.5 lg:w-[39%]">
            {[
              ["/images/criadoras-retrato-1.jpg", "Uma das criadoras sorri segurando diante do rosto o bilhete “se faz sentir, faz sentido.”"],
              ["/images/criadoras-retrato-2.jpg", "A outra criadora segura diante do rosto o bilhete “toda grande mudança começa pequena.”"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[140/217] flex-1 overflow-hidden rounded-[4px]">
                <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 240px, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-2xl leading-[1.2] text-tinta md:text-[clamp(20px,1.7vw,24px)]">
              Somos amigas de longa data, mas foi buscando por algo novo que nossa história (re)começa.
            </p>
            <span className="h-px w-10 bg-luz" />
            <p className="text-[17px] leading-[1.65] text-[#4F4944]">
              Sempre trocamos bilhetes, dividimos a vida e coincidências raras. O sobrenome em comum foi um desses
              presentes que a vida nos deu. Nos tornamos irmãs por escolha e, agora, sócias.
            </p>
            <p className="text-[17px] leading-[1.65] text-[#4F4944]">
              Entre uma mensagem e outra, livros compartilhados e conexões improváveis, nasceram os bilhetes. Com eles, a
              vontade de abrir a roda. Começar pequeno, buscar junto.
            </p>
            <p className="font-hand text-lg leading-[1.5] text-verdade">
              Se essa carta chegou até você, talvez nossos caminhos tenham se encontrado exatamente quando
              precisavam ♡
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Comprar({ soldOut, colorSoldOut }: { soldOut: boolean; colorSoldOut: Record<BoxColor, boolean> }) {
  const itens = [
    ["1 caixa de madeira natural", "Feita à mão e numerada"],
    [`${produto.bilhetes} bilhetes frente e verso`, "Mensagens para viver maior"],
  ];
  return (
    <section id="comprar" className="scroll-mt-20 bg-vinho px-5 py-24 text-center text-leveza md:px-16 md:py-[clamp(56px,8svh,112px)]">
      <div className="largura @container flex flex-col items-center">
        {soldOut ? (
          // esgotado vira prova de procura: selo cheio com foguinho
          <span className="flex items-center gap-2 rounded-full bg-luz px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-vinho">
            <Flame className="size-4 fill-coragem text-coragem" strokeWidth={1.75} aria-hidden />
            Edição limitada · Esgotada
          </span>
        ) : (
          <Eyebrow className="text-luz">EDIÇÃO LIMITADA · COMPRE ONLINE</Eyebrow>
        )}
        {/* a partir do tablet o título fica sempre em 2 linhas: a fonte acompanha a largura do conteúdo para a linha mais longa caber */}
        <h2 className="mt-6 text-[34px] leading-[1.1] tracking-[-0.02em] md:text-[min(46px,calc(100cqw/20))]">
          <span className="block md:whitespace-nowrap">Poucas unidades, muito carinho.</span>
          <span className="block md:whitespace-nowrap">{soldOut ? "Entre na fila de espera." : "Garanta sua Caixa de Bilhetes."}</span>
        </h2>
        <ul className="mt-14 flex w-full flex-col items-center gap-5 border-y border-leveza/20 py-8 md:flex-row md:justify-center md:gap-16">
          {itens.map(([titulo, desc], i) => (
            <Fragment key={titulo}>
              {i > 0 && (
                <li aria-hidden className="text-3xl font-light leading-none text-luz">
                  +
                </li>
              )}
              <li className="flex flex-col items-center gap-1.5">
                <span className="text-base font-medium">{titulo}</span>
                <span className="text-[13px] text-leveza/70">{desc}</span>
              </li>
            </Fragment>
          ))}
        </ul>
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
          {soldOut ? (
            <p className="max-w-[200px] text-left text-[22px] leading-snug md:max-w-[240px] md:text-[26px]">O próximo lote já está a caminho.</p>
          ) : (
            <div className="flex flex-col items-start gap-1 text-left">
              {/* no celular o valor fica numa linha e "à vista" na de baixo */}
              <span className="text-[28px] leading-none md:text-[31px]">
                {produto.precoAVista.replace(/ à vista$/, "")}
                <br className="md:hidden" /> à vista
              </span>
              <span className="text-sm text-leveza/70">ou {produto.parcelas}</span>
              <span className="mt-1.5 text-xs text-leveza/70">
                {/* no celular quebra depois de "incluso" */}
                {produto.frete.replace(/ para .*/, "")}
                <br className="md:hidden" /> {produto.frete.replace(/^.*? (para .*)$/, "$1")}
              </span>
            </div>
          )}
        </div>
        {soldOut ? (
          <>
            <p className="mt-10 max-w-md text-[17px] leading-relaxed text-leveza/75">
              Cada caixa é feita à mão, então os lotes são pequenos. Deixe seu nome e WhatsApp: você fica na fila e
              recebe o aviso antes de todo mundo.
            </p>
            <div className="mt-10 w-full">
              <WaitlistForm tone="dark" />
            </div>
          </>
        ) : (
          <>
            <div className="mt-10 w-full">
              <CheckoutForm colorSoldOut={colorSoldOut} />
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
        <CreditCard className="size-3.5" strokeWidth={1.75} aria-hidden /> Cartão em até 3x
      </span>
      <span aria-hidden>·</span>
      <span>
        via <span className="font-semibold text-leveza/75">InfinitePay</span>
      </span>
    </div>
  );
}

// mosaico colorido da comunidade: duas colunas desencontradas (foto baixa + alta, alta + baixa) e o foco do recorte
const mosaico = [
  [
    ["/images/comunidade-cor-maos.jpg", "Uma das criadoras sorri com as mãos juntas no peito", "flex-[147_1_0%]", "object-[50%_5%]"],
    ["/images/comunidade-cor-abraco.jpg", "As duas criadoras abraçadas, sorrindo, entre as plantas", "flex-[186_1_0%]", ""],
  ],
  [
    ["/images/comunidade-cor-deck.jpg", "As duas criadoras sentadas no deck, cada uma segurando a caixa de bilhetes", "flex-[186_1_0%]", ""],
    ["/images/comunidade-cor-tecido.jpg", "A outra criadora sorri de olhos fechados, com um tecido vinho voando à sua frente", "flex-[147_1_0%]", ""],
  ],
] as const;

function Movimento() {
  return (
    <section id="movimento" className="scroll-mt-20 bg-leveza px-5 py-24 md:px-16 md:py-[clamp(56px,8svh,112px)]">
      {/* no desktop o mosaico fica discreto: 60% da altura entre "Faça parte" e os checkboxes, centralizado nela */}
      <div className="largura grid lg:grid-cols-[1fr_auto] lg:gap-x-16">
        <Eyebrow className="mb-6 text-verdade">COMUNIDADE</Eyebrow>
        <div className="lg:col-start-1 lg:row-start-2">
          <h2 className="text-[40px] leading-[1.05] tracking-[-0.02em] md:text-[clamp(34px,3.1vw,46px)]">
            Faça parte
            <br />
            do movimento.
          </h2>
          <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-tinta-suave">
            Deixe seu WhatsApp para ser convidado para o próximo evento e, de vez em quando, receber uma mensagem de sabedoria.
          </p>
          <div className="mt-11">
            <SubscribeForm />
          </div>
        </div>
        <p className="mt-5 text-[13px] text-tinta-suave lg:col-start-1 lg:row-start-3">
          Para se desinscrever, basta responder “sair”
        </p>
        <div className="mt-14 flex h-[460px] w-full max-w-[440px] gap-2 lg:col-start-2 lg:row-start-2 lg:mt-0 lg:h-[60%] lg:w-[180px] lg:gap-[5px] lg:self-center">
          {mosaico.map((coluna, i) => (
            <div key={i} className="flex flex-1 flex-col gap-2 lg:gap-[5px]">
              {coluna.map(([src, alt, altura, foco]) => (
                <div key={src} className={`relative overflow-hidden rounded-[4px] ${altura}`}>
                  <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 150px, 50vw" className={`object-cover ${foco}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
