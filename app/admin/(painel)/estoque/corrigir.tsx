"use client";

import { useActionState, useState } from "react";
import { type CorrectState, correctStockLotAction } from "../../actions";

// "Corrigir" de um lote: pede a quantidade certa e o motivo. Vira um registro novo no histórico.
export function CorrigirLote({ lotId, current, maxReduce }: { lotId: number; current: number; maxReduce: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CorrectState, FormData>(async (prev, form) => {
    const r = await correctStockLotAction(prev, form);
    if (r?.ok) setOpen(false); // salvou: fecha o formulário e o histórico mostra a correção
    return r;
  }, null);

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[12px] text-tinta-suave hover:text-tinta hover:underline">
        Corrigir
      </button>
    );

  return (
    <form action={action} className="flex w-[300px] flex-col gap-2 rounded-lg border border-tinta/12 bg-leveza/60 p-3">
      <input type="hidden" name="lotId" value={lotId} />
      <label className="flex items-center justify-between gap-3 text-[12px]">
        Quantidade certa do lote
        <input
          name="quantity"
          type="number"
          min={Math.max(current - maxReduce, 0)}
          step={1}
          defaultValue={current}
          required
          autoFocus
          className="h-8 w-20 rounded-md border border-tinta/15 bg-white px-2 text-right tabular-nums outline-none focus:border-verdade/40"
        />
      </label>
      <input
        name="reason"
        required
        maxLength={200}
        placeholder="Motivo (ex.: contei errado, 1 caixa quebrou)"
        className="h-8 rounded-md border border-tinta/15 bg-white px-2 text-[12px] outline-none focus:border-verdade/40"
      />
      <p className="text-[11px] leading-snug text-tinta-suave">
        {maxReduce > 0
          ? `Dá para reduzir até ${maxReduce}${maxReduce < current ? " (as demais já foram vendidas)" : ""}. Aumentar não tem limite.`
          : "Todas as caixas desta cor já foram vendidas: só dá para aumentar."}
      </p>
      {state && !state.ok && <p className="text-[11px] text-coragem">{state.message}</p>}
      <div className="flex items-center gap-2">
        <button
          disabled={pending}
          className="h-7 rounded-md bg-verdade px-3 text-[12px] font-semibold text-leveza transition hover:bg-verdade/90 disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Registrar correção"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-tinta-suave hover:text-tinta">
          Cancelar
        </button>
      </div>
    </form>
  );
}
