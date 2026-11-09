import Link from "next/link";
import { getStock } from "@/lib/stock";
import { instagram, produto } from "@/lib/site";
import { Logo } from "./logo";
import { StickyHeader } from "./sticky-header";

const links = [
  ["Bilhetes", "/#bilhetes"],
  ["Criadoras", "/#criadoras"],
  ["Instagram", instagram],
] as const;

// links externos (Instagram) abrem em outra aba
const externo = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {});

function ctaLabel(soldOut: boolean) {
  return soldOut ? "Fila de espera" : "Eu quero";
}

export async function Nav() {
  const { soldOut } = await getStock();
  return (
    <StickyHeader>
      <nav className="mx-auto flex items-center md:max-w-[calc(var(--largura)+8rem)] justify-between px-5 py-3 transition-[padding] duration-300 group-data-[compact=true]:py-2 md:px-16 md:py-4 md:group-data-[compact=true]:py-2.5">
        <Link href="/" aria-label="bilhetes, página inicial" className="text-verdade">
          <Logo tagline={false} className="w-[108px] transition-[width] duration-300 group-data-[compact=true]:w-[92px] md:w-[132px] md:group-data-[compact=true]:w-[104px]" />
        </Link>
        <div className="hidden items-center gap-10 text-sm text-tinta lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} {...externo(href)} className="transition hover:text-verdade">
              {label}
            </Link>
          ))}
        </div>
        <Link
          href="/#comprar"
          className="hidden rounded-full bg-verdade px-6 py-2.5 text-sm font-semibold text-leveza transition hover:bg-verdade/90 lg:block"
        >
          {ctaLabel(soldOut)}
        </Link>
        <MobileMenu soldOut={soldOut} />
      </nav>
    </StickyHeader>
  );
}

// Menu do celular sem JavaScript: <details> abre e fecha um painel sob a barra.
function MobileMenu({ soldOut }: { soldOut: boolean }) {
  // no celular o "Eu quero" fica só na barra fixa de baixo (MobileBuyBar), não no topo
  return (
    <div className="flex items-center lg:hidden">
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
            {links.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  {...externo(href)}
                  className="flex items-center justify-between border-b border-verdade/10 py-4 text-[22px] text-tinta"
                >
                  {label}
                  <span aria-hidden className="text-base text-verdade">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#comprar"
            className="mt-6 flex h-14 items-center justify-center rounded-full bg-verdade font-medium text-leveza"
          >
            {soldOut ? "Entrar na fila de espera" : "Eu quero"}
          </Link>
        </div>
      </details>
    </div>
  );
}

// Barra fixa no rodapé do celular: preço e compra sempre a um toque.
export async function MobileBuyBar() {
  const { soldOut } = await getStock();
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-full border border-verdade/10 bg-leveza/85 py-2 pl-5 pr-2 shadow-[0_12px_32px_-8px_rgba(46,36,32,0.35)] backdrop-blur-xl pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[15px] font-medium text-tinta">{produto.nome},</span>
        <span className="truncate text-[13px] italic text-verdade">Seu Ritual para Viver Maior.</span>
      </div>
      <Link
        href="/#comprar"
        className="flex h-11 items-center rounded-full bg-verdade px-5 text-sm font-semibold text-leveza active:scale-[0.97]"
      >
        {ctaLabel(soldOut)}
      </Link>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-vinho px-5 pb-28 pt-20 text-leveza md:px-16 md:pt-24 lg:pb-10">
      <div className="largura flex flex-col gap-16">
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
          <div className="flex flex-col gap-4">
            <Logo className="w-[280px] text-luz md:w-[400px]" />
          </div>
          <div className="flex gap-18 text-[15px] text-leveza/85">
            <div className="flex flex-col gap-3.5">
              <span className="text-xs font-semibold tracking-[0.2em] text-luz">EXPLORAR</span>
              <Link href="/#bilhetes">Bilhetes</Link>
              <Link href="/#ritual">Ritual</Link>
            </div>
            <div className="flex flex-col gap-3.5">
              <span className="text-xs font-semibold tracking-[0.2em] text-luz">CONVERSAR</span>
              <a href={instagram} target="_blank" rel="noreferrer">
                @bilhetes.co
              </a>
              <Link href="/#movimento">WhatsApp</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-leveza/15 pt-6 sm:flex-row">
          <p className="text-[13px] text-leveza/60">
            © 2026 bilhetes. Feito por Gabriela Lima e Julia Lima Villa.
          </p>
          <p className="font-hand text-[17px] text-intuicao">toda grande mudança começa pequena</p>
        </div>
      </div>
    </footer>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${className}`}>{children}</p>;
}
