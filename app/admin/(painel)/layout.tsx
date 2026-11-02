import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import { whatsappConfigured } from "@/lib/whatsapp";
import { logoutAction } from "../actions";
import { SideNav } from "./side-nav";

export const metadata: Metadata = { title: "Admin · bilhetes", robots: { index: false } };

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  const connected = whatsappConfigured();
  return (
    <div className="flex min-h-screen bg-leveza">
      <aside className="sticky top-0 flex h-screen w-62 shrink-0 flex-col gap-7 self-start bg-verdade px-4 py-7">
        <div className="flex items-center gap-2.5 px-2.5">
          <span className="font-script text-[38px] leading-none text-luz">bilhetes</span>
          <span className="rounded-md bg-leveza/12 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-leveza/80">
            admin
          </span>
        </div>
        <SideNav />
        <div className="mt-auto flex flex-col gap-1.5 rounded-[10px] bg-leveza/8 p-3.5">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${connected ? "bg-[#6FCF8A]" : "bg-luz"}`} />
            <span className="text-[13px] font-semibold text-leveza">
              {connected ? "WhatsApp conectado" : "WhatsApp em simulação"}
            </span>
          </div>
          <p className="text-xs leading-normal text-leveza/60">
            {connected
              ? "Cloud API da Meta ativa."
              : "As mensagens ficam registradas, mas só saem de verdade depois de conectar a conta da Meta."}
          </p>
        </div>
        <div className="flex items-center justify-between px-2.5 text-[13px] text-leveza/60">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-leveza">
            <ExternalLink className="size-3.5" /> Ver o site
          </a>
          <form action={logoutAction}>
            <button className="flex items-center gap-1.5 transition hover:text-leveza">
              <LogOut className="size-3.5" /> Sair
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-10 pb-12 pt-9">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </div>
    </div>
  );
}
