"use client";

import { useActionState, useState, type ComponentProps } from "react";
import { presaleAction, subscribeAction, waitlistAction, type FormState } from "@/app/actions";
import { produto } from "@/lib/site";

function Feedback({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-sm ${state.ok ? "text-presenca" : "text-coragem"}`}>
      {state.message}
    </p>
  );
}

export function SubscribeForm() {
  const [state, action, pending] = useActionState(subscribeAction, null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex w-full max-w-[560px] flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:border sm:border-verdade/10 sm:bg-white sm:p-2">
        <div className="flex h-14 items-center gap-2 rounded-full border border-verdade/10 bg-white px-5 sm:h-auto sm:flex-1 sm:border-0 sm:bg-transparent sm:px-0 sm:pl-4">
          <span className="flex shrink-0 items-center gap-1.5 text-tinta">
            <span aria-hidden>🇧🇷</span> +55
          </span>
          <span className="h-6 w-px shrink-0 bg-verdade/15" />
          <label className="sr-only" htmlFor="sub-phone">
            WhatsApp
          </label>
          <PhoneInput
            id="sub-phone"
            autoComplete="tel-national"
            placeholder="(11) 90000-0000"
            className="min-w-0 flex-1 bg-transparent text-base text-tinta outline-none placeholder:text-[#9a938c]"
          />
        </div>
        <button
          disabled={pending}
          className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-verdade px-6 text-[15px] font-semibold text-leveza transition active:scale-[0.98] hover:bg-verdade/90 disabled:opacity-60 sm:h-auto sm:py-4"
        >
          <WhatsIcon />
          {pending ? "Enviando…" : "Quero fazer parte"}
        </button>
      </div>
      <fieldset className="flex flex-wrap gap-x-7 gap-y-3">
        <legend className="sr-only">O que você quer receber</legend>
        {[
          ["events", "Eventos futuros"],
          ["wisdom", "Mensagens de sabedoria"],
        ].map(([name, label]) => (
          <label key={name} className="flex cursor-pointer items-center gap-2.5 text-[15px] text-tinta">
            <input type="checkbox" name={name} defaultChecked className="size-[18px] accent-verdade" />
            {label}
          </label>
        ))}
      </fieldset>
      <Feedback state={state} />
      <p className="font-mono text-xs text-tinta-suave">Sem spam. Só o que importa. Para sair, responda “sair”.</p>
    </form>
  );
}

export function PresaleForm() {
  const [state, action, pending] = useActionState(presaleAction, null);
  if (state?.ok) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <p className="font-serif text-3xl text-verdade">Reservado.</p>
        <Feedback state={state} />
      </div>
    );
  }
  return (
    <form action={action} className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <ContactFields />
      <fieldset className="flex flex-wrap justify-center gap-3">
        <legend className="sr-only">Forma de pagamento</legend>
        {[
          ["a_vista", produto.precoAVista],
          ["parcelado", produto.parcelas],
        ].map(([value, label], i) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-verdade/15 px-4 py-2 text-sm has-[:checked]:border-verdade has-[:checked]:bg-verdade/5 has-[:checked]:font-semibold has-[:checked]:text-verdade"
          >
            <input type="radio" name="payment" value={value} defaultChecked={i === 0} className="accent-verdade" />
            {label}
          </label>
        ))}
      </fieldset>
      <button
        disabled={pending}
        className="mx-auto flex w-full items-center justify-center gap-2.5 rounded-full bg-verdade px-10 py-5 text-[17px] font-medium text-leveza transition active:scale-[0.98] hover:bg-verdade/90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Abrindo pagamento…" : "Reservar meu Oráculo"} <span aria-hidden>→</span>
      </button>
      <Feedback state={state} />
    </form>
  );
}

// Edição esgotada: guarda o contato para avisar quando o próximo lote chegar.
export function WaitlistForm() {
  const [state, action, pending] = useActionState(waitlistAction, null);
  if (state?.ok) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <p className="font-serif text-3xl text-verdade">Você está na fila.</p>
        <Feedback state={state} />
      </div>
    );
  }
  return (
    <form action={action} className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <ContactFields />
      <button
        disabled={pending}
        className="mx-auto flex w-full items-center justify-center gap-2.5 rounded-full bg-verdade px-10 py-5 text-[17px] font-medium text-leveza transition active:scale-[0.98] hover:bg-verdade/90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Entrando…" : "Entrar na fila de espera"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function ContactFields() {
  const field =
    "rounded-full border border-verdade/15 bg-white px-6 py-4 text-base outline-none focus:border-verdade/50";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input name="name" required autoComplete="name" placeholder="Seu nome" aria-label="Seu nome" className={field} />
      <PhoneInput placeholder="WhatsApp com DDD" aria-label="WhatsApp com DDD" className={field} />
    </div>
  );
}

function WhatsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" strokeLinejoin="round" />
    </svg>
  );
}

// Máscara de celular brasileiro enquanto digita: (11) 99798-0408. Aceita colar com +55 na frente.
export function maskPhone(value: string) {
  let d = value.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const split = d.length === 11 ? 7 : 6;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}-${d.slice(split)}`;
}

function PhoneInput(props: Omit<ComponentProps<"input">, "value" | "onChange" | "name" | "type">) {
  const [value, setValue] = useState("");
  return (
    <input
      autoComplete="tel"
      {...props}
      name="phone"
      type="tel"
      inputMode="tel"
      required
      value={value}
      onChange={(e) => setValue(maskPhone(e.target.value))}
    />
  );
}
