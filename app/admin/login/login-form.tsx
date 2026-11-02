"use client";

import { useActionState } from "react";
import { loginStepAction } from "../actions";

const input =
  "w-full rounded-lg border border-tinta/15 bg-white px-4 py-3 outline-none focus:border-verdade disabled:opacity-60";
const button =
  "mt-2 w-full rounded-lg bg-verdade py-3 font-semibold text-leveza transition hover:bg-verdade/90 disabled:opacity-60";

export function LoginForm({ linkInvalid }: { linkInvalid: boolean }) {
  const [state, action, pending] = useActionState(loginStepAction, null);

  if (state?.step === "code") {
    return (
      <form action={action} className="flex w-full flex-col gap-3">
        <p className="text-sm leading-relaxed text-tinta-suave">
          Se <strong className="font-semibold text-tinta">{state.email}</strong> tiver acesso, mandamos um código de 6
          dígitos e um link de entrada. Pode levar um minuto; confira também o spam.
        </p>
        <input type="hidden" name="email" value={state.email} />
        <label htmlFor="code" className="sr-only">
          Código de 6 dígitos
        </label>
        <input
          id="code"
          name="code"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className={`${input} text-center font-mono text-2xl tracking-[0.5em]`}
        />
        {state.error && <p className="text-sm text-coragem">{state.error}</p>}
        <button name="intent" value="codigo" disabled={pending} className={button}>
          {pending ? "Conferindo…" : "Entrar"}
        </button>
        <button
          name="intent"
          value="voltar"
          disabled={pending}
          className="text-sm text-tinta-suave underline-offset-4 hover:underline"
        >
          Usar outro e-mail ou pedir novo código
        </button>
      </form>
    );
  }

  const error = state?.error ?? (linkInvalid && !state ? "Esse link já foi usado ou venceu. Peça um novo código." : null);
  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <label htmlFor="email" className="text-sm text-tinta-suave">
        Seu e-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoFocus
        autoComplete="email"
        placeholder="voce@exemplo.com"
        className={input}
      />
      {error && <p className="text-sm text-coragem">{error}</p>}
      <button name="intent" value="email" disabled={pending} className={button}>
        {pending ? "Enviando…" : "Receber código de acesso"}
      </button>
      <p className="text-center text-xs text-tinta-suave">Sem senha: você recebe um código e um link por e-mail.</p>
    </form>
  );
}
