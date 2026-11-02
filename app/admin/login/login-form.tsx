"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <label htmlFor="password" className="text-sm text-tinta-suave">
        Senha
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="rounded-lg border border-tinta/15 bg-white px-4 py-3 outline-none focus:border-verdade"
      />
      {state && !state.ok && <p className="text-sm text-coragem">{state.message}</p>}
      <button
        disabled={pending}
        className="mt-2 rounded-lg bg-verdade py-3 font-semibold text-leveza transition hover:bg-verdade/90 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
