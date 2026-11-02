import type { Metadata } from "next";
import { whatsappConfigured } from "@/lib/whatsapp";
import { logoutAction } from "../actions";
import { SideNav } from "./side-nav";

export const metadata: Metadata = { title: "Admin · bilhetes", robots: { index: false } };

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  const connected = whatsappConfigured();
  return (
    <div className="flex min-h-screen bg-leveza">
      <aside className="sticky top-0 flex h-screen w-62 shrink-0 flex-col gap-7 bg-verdade px-4 py-7">
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
              {connected ? "WhatsApp conectado" : "Modo simulação"}
            </span>
          </div>
          <p className="text-xs leading-normal text-leveza/60">
            {connected
              ? "Cloud API da Meta ativa."
              : "Configure as variáveis WHATSAPP_* para enviar de verdade. Até lá, envios são registrados como simulados."}
          </p>
        </div>
        <form action={logoutAction} className="px-2.5">
          <button className="text-[13px] text-leveza/60 transition hover:text-leveza">Sair</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1 px-10 pb-10 pt-9">{children}</div>
    </div>
  );
}
