import Link from "next/link";
import { instagram, lancamento, produto } from "@/lib/site";
import { Logo } from "./logo";

const links = [
  ["Manifesto", "/manifesto"],
  ["Oráculo", "/#oraculo"],
  ["Ritual", "/#ritual"],
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-verdade/10 bg-leveza/90 backdrop-blur">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-16 md:py-5">
        <Link href="/" aria-label="bilhetes, página inicial" className="text-verdade">
          <Logo className="text-base" />
        </Link>
        <div className="hidden items-center gap-10 text-sm text-tinta lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-verdade">
              {label}
            </Link>
          ))}
          <Link
            href="/#lancamento"
            className="flex items-center gap-2 rounded-full border border-coragem/35 bg-coragem/8 py-1.5 pl-2.5 pr-3.5 font-semibold text-verdade transition hover:bg-coragem/15"
          >
            <span className="relative flex size-3.5 items-center justify-center rounded-full bg-coragem/20">
              <span className="absolute size-3.5 animate-ping rounded-full bg-coragem/30" />
              <span className="size-1.5 rounded-full bg-coragem" />
            </span>
            Lançamento
            <span className="rounded-full bg-coragem px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
              {lancamento.dataCurta}
            </span>
          </Link>
          <Link href="/#movimento" className="transition hover:text-verdade">
            Movimento
          </Link>
        </div>
        <Link
          href="/#reserva"
          className="hidden rounded-full bg-verdade px-5 py-2.5 text-sm font-medium text-leveza transition hover:bg-verdade/90 lg:block"
        >
          Reservar o Oráculo
        </Link>
        <MobileMenu />
      </nav>
    </header>
  );
}

// Menu do celular sem JavaScript: <details> abre e fecha um painel sob a barra.
function MobileMenu() {
  return (
    <div className="flex items-center gap-2 lg:hidden">
      <Link
        href="/#lancamento"
        className="flex items-center gap-1.5 rounded-full border border-coragem/35 bg-coragem/8 py-1.5 pl-2 pr-2.5 text-xs font-semibold text-verdade"
      >
        <span className="relative flex size-2.5 items-center justify-center">
          <span className="absolute size-2.5 animate-ping rounded-full bg-coragem/40" />
          <span className="size-1.5 rounded-full bg-coragem" />
        </span>
        {lancamento.dataCurta}
      </Link>
      <details className="group">
        <summary
          aria-label="Abrir menu"
          className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full [&::-webkit-details-marker]:hidden"
        >
          <span className="flex w-5 flex-col gap-[5px]">
            <span className="h-px w-full bg-tinta transition group-open:translate-y-[3px] group-open:rotate-45" />
            <span className="h-px w-full bg-tinta transition group-open:-translate-y-[3px] group-open:-rotate-45" />
          </span>
        </summary>
        <div className="absolute inset-x-0 top-full border-b border-verdade/10 bg-leveza px-5 pb-8 pt-4 shadow-[0_24px_40px_-24px_rgba(91,31,46,0.25)]">
          <ul className="flex flex-col">
            {[...links, ["Lançamento", "/#lancamento"] as const, ["Movimento", "/#movimento"] as const].map(
              ([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center justify-between border-b border-verdade/10 py-4 font-serif text-[28px] text-tinta"
                  >
                    {label}
                    <span aria-hidden className="text-base text-verdade">
                      →
                    </span>
                  </Link>
                </li>
              ),
            )}
          </ul>
          <Link
            href="/#reserva"
            className="mt-6 flex h-14 items-center justify-center rounded-full bg-verdade font-medium text-leveza"
          >
            Reservar o Oráculo
          </Link>
        </div>
      </details>
    </div>
  );
}

// Barra fixa no rodapé do celular: preço e reserva sempre a um toque.
export function MobileBuyBar() {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-full border border-verdade/10 bg-leveza/85 py-2 pl-5 pr-2 shadow-[0_12px_32px_-8px_rgba(46,36,32,0.35)] backdrop-blur-xl pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-lg text-tinta">{produto.nome}</span>
        <span className="text-xs text-tinta-suave">{produto.precoAVista}</span>
      </div>
      <Link
        href="/#reserva"
        className="flex h-11 items-center rounded-full bg-verdade px-5 text-sm font-semibold text-leveza active:scale-[0.97]"
      >
        Reservar
      </Link>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-verdade px-5 pb-28 pt-20 text-leveza md:px-24 md:pt-24 lg:pb-10">
      <div className="mx-auto flex max-w-[1248px] flex-col gap-16">
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <span className="font-script text-[96px] leading-[0.85] text-luz md:text-[140px]">bilhetes</span>
            <span className="text-[11px] tracking-[0.3em] text-leveza/70 md:text-[13px] md:tracking-[0.45em]">ORÁCULO · UM RITUAL PARA VIVER MAIOR</span>
          </div>
          <div className="flex gap-18 text-[15px] text-leveza/85">
            <div className="flex flex-col gap-3.5">
              <span className="font-mono text-xs tracking-[0.2em] text-luz">EXPLORAR</span>
              <Link href="/manifesto">Manifesto</Link>
              <Link href="/#oraculo">Oráculo</Link>
              <Link href="/#ritual">Ritual</Link>
              <Link href="/#lancamento">Lançamento</Link>
            </div>
            <div className="flex flex-col gap-3.5">
              <span className="font-mono text-xs tracking-[0.2em] text-luz">CONVERSAR</span>
              <a href={instagram} target="_blank" rel="noreferrer">
                @bilhetes.co
              </a>
              <Link href="/#movimento">WhatsApp</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-leveza/15 pt-6 sm:flex-row">
          <p className="text-[13px] text-leveza/60">
            © 2026 bilhetes. Feito à mão por Gabriela Lima e Julia Lima Villa.
          </p>
          <p className="font-hand text-xl text-intuicao">toda grande mudança começa pequena</p>
        </div>
      </div>
    </footer>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-mono text-[13px] tracking-[0.23em] ${className}`}>{children}</p>;
}
