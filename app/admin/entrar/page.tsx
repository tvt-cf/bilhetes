import type { Metadata } from "next";
import { Suspense } from "react";
import { confirmLinkAction } from "../actions";
import { LoginShell } from "../login/login-shell";

export const metadata: Metadata = { title: "Entrar · bilhetes admin", robots: { index: false } };

// Destino do link mágico. Pede um clique para que leitores de link do e-mail não gastem o acesso.
export default function EntrarPage({ searchParams }: PageProps<"/admin/entrar">) {
  return (
    <LoginShell>
      <Suspense>
        <Confirm searchParams={searchParams} />
      </Suspense>
    </LoginShell>
  );
}

async function Confirm({ searchParams }: { searchParams: PageProps<"/admin/entrar">["searchParams"] }) {
  const { token } = await searchParams;
  return (
    <form action={confirmLinkAction} className="flex w-full flex-col gap-4 text-center">
      <input type="hidden" name="token" value={typeof token === "string" ? token : ""} />
      <p className="text-sm text-tinta-suave">Falta um toque para entrar no admin.</p>
      <button className="w-full rounded-lg bg-verdade py-3 font-semibold text-leveza transition hover:bg-verdade/90">
        Entrar no admin
      </button>
    </form>
  );
}
