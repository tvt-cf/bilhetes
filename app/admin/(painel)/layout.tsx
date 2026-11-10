import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getAdmin } from "@/lib/auth";
import { whatsappConfigured } from "@/lib/whatsapp";
import { logoutAction } from "../actions";
import { Logo } from "@/components/site/logo";
import { SideNav } from "./side-nav";
import { fadeOnOpen, showOnOpen } from "./ui";

export const metadata: Metadata = { title: "Admin · bilhetes", robots: { index: false } };

const hideOnOpen = "transition-opacity duration-150 group-hover/nav:opacity-0 group-has-[:focus-visible]/nav:opacity-0";
const navRow =
  "flex items-center gap-3 rounded-lg px-[11px] py-2 text-[13px] text-leveza/60 transition hover:bg-leveza/6 hover:text-leveza";

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  const connected = whatsappConfigured();
  return (
    <div className="flex min-h-screen bg-leveza">
      {/* Menu recolhido em ícones; abre por cima do conteúdo ao passar o mouse (ou com o foco no teclado). */}
      <div className="group/nav sticky top-0 z-30 h-screen w-16 shrink-0 self-start">
        <aside className="absolute inset-y-0 left-0 flex w-16 flex-col gap-7 overflow-hidden bg-vinho px-3 py-7 transition-[width,box-shadow] duration-200 ease-out group-has-[:focus-visible]/nav:w-62 group-has-[:focus-visible]/nav:shadow-2xl group-hover/nav:w-62 group-hover/nav:shadow-2xl">
          <div className="relative h-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className={`absolute left-1 top-0 size-8 rounded-lg ${hideOnOpen}`} />
            <div className={`absolute inset-y-0 left-2.5 flex items-center gap-2.5 ${showOnOpen}`}>
              <Logo tagline={false} className="w-[104px] text-luz" />
              <span className="rounded-md bg-leveza/12 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-leveza/80">
                admin
              </span>
            </div>
          </div>
          <SideNav />
          <div
            className="mt-auto flex flex-col gap-1.5 rounded-[10px] px-[15px] py-3.5 transition-colors group-has-[:focus-visible]/nav:bg-leveza/8 group-hover/nav:bg-leveza/8"
            title={connected ? "WhatsApp conectado" : "WhatsApp em simulação"}
          >
            <div className="flex items-center gap-3">
              <span className={`size-2.5 shrink-0 rounded-full ${connected ? "bg-[#6FCF8A]" : "bg-luz"}`} />
              <span className={`whitespace-nowrap text-[13px] font-semibold text-leveza ${showOnOpen}`}>
                {connected ? "WhatsApp conectado" : "WhatsApp em simulação"}
              </span>
            </div>
            <p className={`w-[190px] text-xs leading-normal text-leveza/60 ${fadeOnOpen}`}>
              {connected
                ? "Cloud API da Meta ativa."
                : "As mensagens ficam registradas, mas só saem de verdade depois de conectar a conta da Meta."}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Suspense>
              <CurrentAdmin />
            </Suspense>
            <a href="/" target="_blank" rel="noreferrer" className={navRow} title="Ver o site">
              <ExternalLink className="size-[18px] shrink-0" strokeWidth={1.75} />
              <span className={showOnOpen}>Ver o site</span>
            </a>
            <form action={logoutAction}>
              <button className={`${navRow} w-full`} title="Sair">
                <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} />
                <span className={showOnOpen}>Sair</span>
              </button>
            </form>
          </div>
        </aside>
      </div>
      <div className="min-w-0 flex-1 px-10 pb-12 pt-9">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </div>
    </div>
  );
}

async function CurrentAdmin() {
  const admin = await getAdmin();
  if (!admin) return null;
  return (
    <div className="mb-1 flex items-center gap-3 px-1" title={admin.email}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-intuicao text-xs font-semibold uppercase text-verdade">
        {admin.email[0]}
      </span>
      <span className={`truncate text-[13px] text-leveza/80 ${showOnOpen}`}>{admin.email}</span>
    </div>
  );
}
