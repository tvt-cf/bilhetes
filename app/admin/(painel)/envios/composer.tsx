"use client";

import { useActionState, useState } from "react";
import type { CampaignKind, Segment } from "@/lib/db/schema";
import { createCampaignAction, sendTestAction } from "../../actions";

const kinds: [CampaignKind, string, string][] = [
  ["sabedoria", "Bilhete de sabedoria", "Vai só para quem aceitou mensagens de sabedoria."],
  ["evento", "Convite de evento", "Vai só para quem aceitou receber eventos."],
  ["pedido", "Aviso de pedido", "Para avisos sobre a compra, como envio e entrega."],
  ["lote", "Aviso de novo lote", "Para avisar a fila de espera que o Oráculo voltou."],
];
const segments: [Segment, string][] = [
  ["comunidade", "Só comunidade"],
  ["fila_espera", "Fila de espera"],
  ["pre_venda", "Pré-venda"],
  ["comprou", "Compraram"],
];

const fmt = new Intl.NumberFormat("pt-BR");

export function Composer({ audience }: { audience: Record<CampaignKind, Record<Segment, number>> }) {
  const [kind, setKind] = useState<CampaignKind>("sabedoria");
  const [selected, setSelected] = useState<Segment[]>(["comunidade", "fila_espera", "pre_venda", "comprou"]);
  const [body, setBody] = useState("Bom dia, {{nome}}. O silêncio também é resposta.");
  const [when, setWhen] = useState<"agora" | "agendar">("agendar");
  const [localDate, setLocalDate] = useState("");
  const [state, action, pending] = useActionState(createCampaignAction, null);
  const [testState, testAction, testing] = useActionState(sendTestAction, null);

  const total = selected.reduce((n, s) => n + audience[kind][s], 0);
  const preview = body
    .replace(/\{\{\s*nome\s*\}\}/gi, "Marina")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ");
  // datetime-local vem no fuso do navegador; enviamos em ISO para o servidor não depender do fuso dele
  const scheduledIso = localDate ? new Date(localDate).toISOString() : "";

  const toggle = (s: Segment) =>
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <form action={action} className="flex-1 divide-y divide-tinta/8 rounded-xl border border-tinta/8 bg-white">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="scheduledAt" value={scheduledIso} />
        <input type="hidden" name="when" value={when} />
        {selected.map((s) => (
          <input key={s} type="hidden" name="segments" value={s} />
        ))}

        <Step title="1. Público">
          <div className="flex flex-wrap gap-2">
            {segments.map(([s, label]) => (
              <Option key={s} on={selected.includes(s)} onClick={() => toggle(s)}>
                {label} <span className="text-xs font-normal text-[#9a938c]">{fmt.format(audience[kind][s])}</span>
              </Option>
            ))}
          </div>
          <p className="rounded-lg bg-leveza px-3 py-2.5 text-[13px]">
            <strong className="font-semibold">{fmt.format(total)} destinatários.</strong>{" "}
            {kinds.find(([k]) => k === kind)?.[2]} Descadastrados nunca recebem.
          </p>
        </Step>

        <Step title="2. Tipo de mensagem">
          <div className="flex flex-wrap gap-2">
            {kinds.map(([k, label]) => (
              <Option
                key={k}
                on={kind === k}
                onClick={() => {
                  setKind(k);
                  if (k === "lote") setSelected(["fila_espera"]);
                }}
              >
                {label}
              </Option>
            ))}
          </div>
        </Step>

        <Step title="3. Mensagem">
          <input
            name="title"
            required
            placeholder="Nome do envio, ex.: Bilhete #13 · O silêncio também é resposta"
            className="rounded-lg border border-tinta/15 px-3.5 py-2.5 text-sm outline-none focus:border-verdade/50"
          />
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={1000}
            className="rounded-lg border border-tinta/15 px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-verdade/50"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-tinta-suave">
            <button
              type="button"
              onClick={() => setBody((b) => b + "{{nome}}")}
              className="rounded-md bg-leveza px-2 py-1 hover:bg-tinta/8"
            >
              + {"{{nome}}"}
            </button>
            <span>
              Vai dentro do template aprovado pela Meta. Quebras de linha viram espaço. {body.length}/1000
            </span>
          </div>
        </Step>

        <Step title="4. Quando enviar">
          <div className="flex flex-wrap items-center gap-3">
            <Option on={when === "agora"} onClick={() => setWhen("agora")}>
              Agora
            </Option>
            <Option on={when === "agendar"} onClick={() => setWhen("agendar")}>
              Agendar
            </Option>
            {when === "agendar" && (
              <input
                type="datetime-local"
                value={localDate}
                onChange={(e) => setLocalDate(e.target.value)}
                required
                className="rounded-lg border border-tinta/15 px-3 py-2 text-sm"
              />
            )}
          </div>
          <p className="text-xs text-tinta-suave">
            Agendados saem no primeiro ciclo do agendador após o horário (todo dia às 7h de Brasília).
          </p>
        </Step>

        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4">
          {(state || testState) && (
            <p className={`mr-auto text-sm ${(state ?? testState)!.ok ? "text-presenca" : "text-coragem"}`}>
              {(testState && !state ? testState : state)!.message}
            </p>
          )}
          <button
            formAction={testAction}
            disabled={testing}
            className="rounded-lg border border-tinta/15 px-4 py-2.5 text-sm font-medium transition hover:border-tinta/30 disabled:opacity-60"
          >
            {testing ? "Enviando teste…" : "Enviar teste para mim"}
          </button>
          <button
            disabled={pending || total === 0}
            className="rounded-lg bg-verdade px-5 py-2.5 text-sm font-semibold text-leveza transition hover:bg-verdade/90 disabled:opacity-50"
          >
            {pending ? "Salvando…" : when === "agora" ? `Enviar para ${fmt.format(total)}` : "Agendar envio"}
          </button>
        </div>
      </form>

      <div className="flex w-full flex-col gap-3.5 xl:w-[340px]">
        <span className="text-[11px] font-semibold tracking-wider text-[#9a938c]">PRÉ-VISUALIZAÇÃO</span>
        <div className="overflow-hidden rounded-3xl border border-tinta/12 bg-[#E9E1D6]">
          <div className="flex items-center gap-2.5 bg-verdade px-4 py-3.5">
            <span className="flex size-[34px] items-center justify-center rounded-full bg-leveza/12 font-script text-2xl text-luz">
              b
            </span>
            <div>
              <p className="text-sm font-semibold text-leveza">bilhetes.co</p>
              <p className="text-[11px] text-leveza/70">Conta comercial</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4 pb-7 pt-5">
            <div className="flex w-[260px] flex-col gap-1.5 rounded-[4px_14px_14px_14px] bg-white px-3.5 py-3">
              <p className="whitespace-pre-line text-[13px] leading-snug">{preview || "…"}</p>
              <span className="text-[10px] text-[#9a938c]">07:00</span>
            </div>
            <div className="w-[260px] rounded-xl bg-white px-3.5 py-2.5 text-center text-[13px] font-medium text-recomeco">
              Parar de receber
            </div>
          </div>
        </div>
        <p className="text-xs leading-normal text-tinta-suave">
          O texto final depende do template aprovado na Meta; a mensagem acima entra no lugar da variável {"{{1}}"}.
        </p>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Option({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition ${
        on
          ? "border-[1.5px] border-verdade bg-verdade/5 font-semibold text-verdade"
          : "border border-tinta/15 font-medium hover:border-tinta/30"
      }`}
    >
      {on && <span aria-hidden>✓</span>}
      {children}
    </button>
  );
}
