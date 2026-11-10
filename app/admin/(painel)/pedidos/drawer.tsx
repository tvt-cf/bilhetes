"use client";

import { Archive, ArchiveRestore, ExternalLink, RefreshCw, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { DeliveryStatus, OrderStatus } from "@/lib/db/schema";
import type { TimelineEvent } from "@/lib/orders";
import { formatPhone } from "@/lib/phone";
import { archiveOrdersAction, orderTimelineAction, recheckOrdersAction, updateDeliveryAction } from "../../actions";
import { dotOk } from "../ui";
import { boxStyle, brl, deliveryOf, deliveryOrder, deliveryStyle, fmtCep, methodLabel, optionLabel, type OrderRow, statusStyle } from "./format";

const fmtFull = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const fmtShort = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

const viaLabel = { cliente: "Cliente no site", webhook: "InfinitePay (webhook)", retorno: "Retorno do pagamento", admin: "Admin" };
const statusName = (s?: OrderStatus) => (s ? statusStyle[s][0] : "—");
const deliveryName = (s?: DeliveryStatus) => (s ? deliveryStyle[s][0] : "—");
const methodName = (m?: string | null) => (m === "pix" ? "Pix" : m === "credit_card" ? "cartão" : null);

// Por que o pedido ficou divergente (ou por que a conferência não concluiu nada).
function why(d: NonNullable<TimelineEvent["detail"]>) {
  if (d.reason === "falha") return "A InfinitePay não respondeu à conferência; nada mudou. Tente conferir de novo.";
  if (d.reason === "nao_confirmado") return "A InfinitePay não confirma pagamento para essa transação.";
  if (d.reason === "valor")
    return `Valor confirmado ${d.amount != null ? brl(d.amount) : "não informado"}, esperado ${(d.expected ?? []).map(brl).join(" ou ")}.`;
  return null;
}

function describe(e: TimelineEvent): [title: string, detail: string | null, dot: string] {
  const d = e.detail ?? {};
  const paid = d.paidAmount != null ? `${brl(d.paidAmount)}${methodName(d.method) ? ` no ${methodName(d.method)}` : ""}` : null;
  const reason = why(d);
  switch (e.kind) {
    case "criado":
      return ["Checkout aberto", "Escolheu a caixa, preencheu o endereço e foi para o pagamento", "bg-tinta/30"];
    case "link":
      return ["Link de pagamento gerado na InfinitePay", null, "bg-tinta/30"];
    case "status":
      return [
        d.to === "pago" ? "Pagamento confirmado" : d.to === "divergente" ? "Pagamento divergente" : "Status alterado",
        [`${statusName(d.from)} → ${statusName(d.to)}`, paid, reason].filter(Boolean).join(" · "),
        d.to === "pago" ? dotOk : d.to === "divergente" ? "bg-coragem" : "bg-luz",
      ];
    case "conferido":
      return [
        d.reason === "falha" ? "Conferência sem resposta" : "Conferido na InfinitePay",
        reason ?? `Sem mudança · ${statusName(d.to)}${paid ? ` · ${paid}` : ""}`,
        d.reason === "falha" ? "bg-luz" : "bg-tinta/30",
      ];
    case "entregue":
      return ["Entregue", "Saiu de reservados e entrou em entregues no estoque", dotOk];
    case "entrega_desfeita":
      return ["Entrega desfeita", "Voltou para reservados no estoque", "bg-tinta/50"];
    case "entrega": {
      const moved = d.deliveryTo && d.deliveryFrom !== d.deliveryTo;
      const fields = [
        d.carrier !== undefined && `Transporte: ${d.carrier ?? "(apagado)"}`,
        d.owner !== undefined && `Responsável: ${d.owner ?? "(apagado)"}`,
        d.complaint !== undefined && (d.complaint ? `Reclamação: “${d.complaint}”` : "Reclamação apagada"),
      ].filter(Boolean);
      return [
        moved ? `Entrega: ${deliveryName(d.deliveryFrom)} → ${deliveryName(d.deliveryTo)}` : "Dados da entrega atualizados",
        fields.join(" · ") || null,
        d.deliveryTo === "entregue" ? dotOk : d.deliveryTo === "reclamacao" ? "bg-coragem" : "bg-recomeco/60",
      ];
    }
    case "arquivado":
      return ["Arquivado", "Saiu da lista e dos números do admin", "bg-tinta/50"];
    case "desarquivado":
      return ["Desarquivado", "Voltou para a lista e para os números do admin", "bg-tinta/50"];
  }
}

export function PedidoDrawer({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [shown, setShown] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Recarrega quando o pedido muda na lista (arquivou, conferiu, chegou pagamento).
  const deliveryVersion = [order.deliveryStatus, order.carrier, order.deliveryOwner, order.complaint].join("|");
  const version = `${order.id}:${order.status}:${order.checkedAt?.getTime()}:${order.archivedAt?.getTime()}:${deliveryVersion}`;
  useEffect(() => {
    let alive = true;
    orderTimelineAction(order.id)
      .then((t) => alive && setTimeline(t))
      .catch(() => alive && setTimeline([]));
    return () => {
      alive = false;
    };
  }, [order.id, version]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      setError("");
      try {
        await fn();
        setTimeline(await orderTimelineAction(order.id));
      } catch {
        setError("Não deu para salvar. Tente de novo.");
      }
    });

  const recheck = () => {
    const form = new FormData();
    form.set("orderId", String(order.id));
    run(() => recheckOrdersAction(form));
  };

  const [label, cls] = statusStyle[order.status];
  const a = order.address;
  const facts: [string, React.ReactNode][] = [
    ["Cor", order.boxColor ? boxStyle[order.boxColor][0] : "—"],
    ["Opção", optionLabel(order)],
    ["Cobrado", brl(order.amount)],
    ["Pago", order.paidAmount != null ? brl(order.paidAmount) : "—"],
    ["Forma", methodLabel(order) || "—"],
    ["NSU", order.transactionNsu ?? "—"],
  ];

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Pedido #${order.id}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-tinta/20 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-[440px] max-w-full flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-tinta/8 px-6 pb-5 pt-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-[28px] leading-none">Pedido #{order.id}</h2>
              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
              {order.archivedAt && (
                <span className="rounded-full bg-tinta/8 px-2 py-0.5 text-[11px] font-semibold text-tinta-suave">Arquivado</span>
              )}
            </div>
            <span className="text-[13px] text-tinta">
              {order.name ?? "Sem nome"}
              <span className="text-tinta-suave">
                {order.phone ? ` · ${formatPhone(order.phone)}` : ""}
                {order.orderNumber ? ` · ${order.orderNumber}` : ""}
              </span>
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="-mr-1.5 rounded-lg p-1.5 text-tinta-suave hover:bg-tinta/5 hover:text-tinta">
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="grid grid-cols-3 gap-x-4 gap-y-3.5 border-b border-tinta/8 px-6 py-5">
            {facts.map(([k, v]) => (
              <div key={k} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9a938c]">{k}</span>
                <span className="truncate text-[12px] tabular-nums" title={typeof v === "string" ? v : undefined}>
                  {v}
                </span>
              </div>
            ))}
            <div className="col-span-3 flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9a938c]">Entrega</span>
              <span className="text-[12px] leading-snug">
                {a ? (
                  <>
                    <span className="font-medium tabular-nums">{fmtCep(a.cep)}</span> · {a.street}, {a.number}
                    {a.complement ? ` · ${a.complement}` : ""} · {a.neighborhood} · {a.city}/{a.state}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
            {order.receiptUrl && (
              <a
                href={order.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="col-span-3 inline-flex items-center gap-1.5 text-[12px] text-recomeco hover:underline"
              >
                Ver comprovante <ExternalLink className="size-3" />
              </a>
            )}
          </section>

          {deliveryOf(order) && (
            <EntregaForm
              key={deliveryVersion}
              order={order}
              pending={pending}
              onSave={(patch) => run(() => updateDeliveryAction([order.id], patch))}
            />
          )}

          <section className="px-6 py-5">
            <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-[#9a938c]">Linha do tempo</h3>
            {timeline === null ? (
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-tinta/5" />
                ))}
              </div>
            ) : (
              <ol className="relative flex flex-col gap-5 before:absolute before:bottom-2 before:left-[4.5px] before:top-2 before:w-px before:bg-tinta/10">
                {timeline.map((e, i) => {
                  const [title, detail, dot] = describe(e);
                  return (
                    <li key={i} className="relative flex gap-3.5 pl-0">
                      <span className={`relative mt-[5px] size-2.5 shrink-0 rounded-full ring-4 ring-white ${dot}`} />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[13px] font-medium">{title}</span>
                        {detail && <span className="text-[12px] text-tinta">{detail}</span>}
                        <span className="text-[11px] text-tinta-suave">
                          {fmtFull.format(e.at)} ·{" "}
                          {e.inferred ? (
                            <span className="italic">registrado antes do histórico</span>
                          ) : e.via === "admin" && e.actor ? (
                            <>
                              por <span className="font-medium text-tinta">{e.actor}</span>
                            </>
                          ) : (
                            viaLabel[e.via]
                          )}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <footer className="flex items-center gap-2 border-t border-tinta/8 px-6 py-4">
          {order.transactionNsu && (
            <button type="button" onClick={recheck} disabled={pending} className={btn}>
              <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} /> Conferir na InfinitePay
            </button>
          )}
          <button type="button" onClick={() => run(() => archiveOrdersAction([order.id], !order.archivedAt))} disabled={pending} className={btn}>
            {order.archivedAt ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
            {order.archivedAt ? "Desarquivar" : "Arquivar"}
          </button>
          {error && <span className="text-[12px] text-coragem">{error}</span>}
        </footer>
      </aside>
    </div>
  );
}

const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-tinta/15 bg-white px-3 text-[12px] font-medium transition hover:border-tinta/30 disabled:opacity-50";

// Entrega do pedido pago: etapa, transporte, responsável e reclamação. Salvar registra na linha do tempo.
function EntregaForm({
  order,
  pending,
  onSave,
}: {
  order: OrderRow;
  pending: boolean;
  onSave: (patch: { status: DeliveryStatus; carrier: string; owner: string; complaint: string }) => void;
}) {
  const initial = {
    status: deliveryOf(order)!,
    carrier: order.carrier ?? "",
    owner: order.deliveryOwner ?? "",
    complaint: order.complaint ?? "",
  };
  const [form, setForm] = useState(initial);
  const changed = (Object.keys(initial) as (keyof typeof initial)[]).some((k) => form[k].trim() !== initial[k]);
  const set = (k: keyof typeof initial) => (e: { target: { value: string } }) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  return (
    <section className="flex flex-col gap-3 border-b border-tinta/8 px-6 py-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#9a938c]">Entrega</h3>
        {order.deliveredAt && <span className="text-[11px] text-tinta-suave">Entregue em {fmtShort.format(order.deliveredAt)}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {deliveryOrder.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setForm((f) => ({ ...f, status: d }))}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              form.status === d ? `${deliveryStyle[d][1]} ring-1 ring-current` : "bg-tinta/[0.04] text-tinta-suave hover:bg-tinta/[0.08]"
            }`}
          >
            {deliveryStyle[d][0]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={label}>
          Transporte
          <input value={form.carrier} onChange={set("carrier")} maxLength={300} placeholder="Ex.: motoboy, Loggi" className={field} />
        </label>
        <label className={label}>
          Responsável
          <input value={form.owner} onChange={set("owner")} maxLength={300} placeholder="Quem cuida da entrega" className={field} />
        </label>
      </div>
      <label className={label}>
        Reclamação
        <textarea
          value={form.complaint}
          onChange={set("complaint")}
          maxLength={300}
          rows={form.status === "reclamacao" || form.complaint ? 3 : 1}
          placeholder="O que a pessoa relatou (fica no histórico)"
          className={`${field} h-auto resize-none py-1.5`}
        />
      </label>
      <button
        type="button"
        disabled={!changed || pending}
        onClick={() => onSave(form)}
        className="self-start rounded-lg bg-verdade px-3.5 py-1.5 text-[12px] font-semibold text-leveza transition hover:bg-verdade/90 disabled:opacity-40"
      >
        {pending ? "Salvando…" : "Salvar entrega"}
      </button>
    </section>
  );
}

const label = "flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#9a938c]";
const field =
  "h-8 rounded-md border border-tinta/15 bg-white px-2 text-[12px] font-normal normal-case tracking-normal text-tinta outline-none focus:border-verdade/40";
