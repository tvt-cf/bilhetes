"use client";

import { Archive, ArchiveRestore, ArrowDown, MessageSquareWarning, ArrowUp, ArrowUpDown, ChevronDown, ChevronsUpDown, Search, X } from "lucide-react";
import { Fragment, useCallback, useMemo, useState, useTransition } from "react";
import { formatPhone } from "@/lib/phone";
import { archiveOrdersAction, recheckOrdersAction, updateDeliveryAction } from "../../actions";
import { PedidoDrawer } from "./drawer";
import type { DeliveryStatus } from "@/lib/db/schema";
import { boxStyle, brl, deliveryOf, deliveryOrder, deliveryStyle, fmtCep, methodLabel, optionLabel, type OrderRow, statusStyle } from "./format";

const fmtDay = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
// Busca sem acento e sem caixa: "sao paulo" encontra "São Paulo".
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function haystack(o: OrderRow) {
  const a = o.address;
  return norm(
    [
      `#${o.id}`,
      o.name,
      o.phone,
      o.phone && formatPhone(o.phone),
      o.orderNumber,
      o.boxColor && `caixa ${o.boxColor}`,
      a && [a.cep, fmtCep(a.cep), a.street, a.number, a.complement, a.neighborhood, a.city, a.state].join(" "),
      optionLabel(o),
      methodLabel(o),
      statusStyle[o.status][0],
      deliveryOf(o) && `entrega ${deliveryStyle[deliveryOf(o)!][0]}`,
      o.carrier,
      o.deliveryOwner,
      o.complaint,
      o.transactionNsu,
      fmtDate.format(o.createdAt),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

type SortKey = "id" | "name" | "box" | "cep" | "option" | "amount" | "paid" | "method" | "status" | "delivery" | "checked";

const sortValue: Record<SortKey, (o: OrderRow) => string | number | null> = {
  id: (o) => o.id,
  name: (o) => (o.name ? norm(o.name) : null),
  box: (o) => o.boxColor,
  cep: (o) => o.address?.cep ?? null,
  option: (o) => o.paymentPreference,
  amount: (o) => o.amount,
  paid: (o) => o.paidAmount,
  method: (o) => methodLabel(o) || null,
  status: (o) => o.status,
  delivery: (o) => (deliveryOf(o) ? deliveryOrder.indexOf(deliveryOf(o)!) : null),
  checked: (o) => o.checkedAt?.getTime() ?? null,
};

const columns: [SortKey | null, string, string?][] = [
  ["id", "Pedido"],
  ["name", "Pessoa"],
  ["box", "Cor"],
  ["cep", "CEP e endereço"],
  ["option", "Opção"],
  ["amount", "Cobrado", "text-right"],
  ["paid", "Pago", "text-right"],
  ["method", "Forma"],
  ["status", "Status"],
  ["delivery", "Entrega"],
  ["checked", "Conferido"],
  [null, ""],
];

// Filtros rápidos (chips): arquivados só aparecem no próprio filtro.
const segments = [
  ["todos", "Todos", (o: OrderRow) => !o.archivedAt],
  ["pago", "Pagos", (o: OrderRow) => !o.archivedAt && o.status === "pago"],
  ["aguardando", "Aguardando", (o: OrderRow) => !o.archivedAt && o.status === "aguardando"],
  ["divergente", "Divergentes", (o: OrderRow) => !o.archivedAt && o.status === "divergente"],
  // etapas da entrega (só pedidos pagos)
  ...deliveryOrder.map((d) => [`entrega:${d}`, deliveryStyle[d][0], (o: OrderRow) => deliveryOf(o) === d] as const),
  ["arquivados", "Arquivados", (o: OrderRow) => !!o.archivedAt],
] as const;
type Segment = (typeof segments)[number][0];
const deliverySelect =
  "cursor-pointer appearance-none rounded-full py-0.5 pl-2 pr-5 text-[11px] font-semibold outline-none bg-[length:10px] bg-[right_6px_center] bg-no-repeat focus-visible:ring-2 focus-visible:ring-verdade/30";
const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-opacity='.45' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const sortOptions: [SortKey, 1 | -1, string][] = [
  ["id", -1, "Pedido, mais recente"],
  ["id", 1, "Pedido, mais antigo"],
  ["paid", -1, "Pago, maior valor"],
  ["amount", -1, "Cobrado, maior valor"],
  ["name", 1, "Pessoa, A–Z"],
  ["cep", 1, "CEP, menor primeiro"],
  ["status", 1, "Status"],
  ["checked", -1, "Conferido, mais recente"],
];

const th = "px-2.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9a938c] first:pl-5 last:pr-5";
const td = "px-2.5 py-2.5 align-top text-[12px] leading-snug first:pl-5 last:pr-5";
const sub = "block text-[11px] text-tinta-suave";
const checkbox = "size-4 cursor-pointer rounded accent-verdade align-middle";
const bulkBtn =
  "inline-flex h-8 items-center gap-1.5 rounded-lg bg-tinta px-3 text-[12px] font-semibold text-white transition hover:bg-tinta/85 disabled:opacity-50";
const dash = <span className="text-[#c4bdb5]">—</span>;

export function TabelaPedidos({ rows, initialOpenId }: { rows: OrderRow[]; initialOpenId?: number }) {
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState<Segment>("todos");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "id", dir: -1 });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  // ?pedido=12 (link da Comunidade) já abre o drawer desse pedido
  const [openId, setOpenId] = useState<number | null>(initialOpenId ?? null);
  const closeDrawer = useCallback(() => setOpenId(null), []);
  // Procura em todas as linhas: o pedido continua aberto mesmo se sair do filtro (ex.: ao arquivar).
  const openOrder = openId != null ? rows.find((o) => o.id === openId) : undefined;

  const indexed = useMemo(() => rows.map((o) => ({ o, text: haystack(o) })), [rows]);

  // Busca primeiro; os chips contam dentro do que a busca encontrou.
  const found = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return (terms.length ? indexed.filter(({ text }) => terms.every((t) => text.includes(t))) : indexed).map(({ o }) => o);
  }, [indexed, q]);

  const counts = useMemo(
    () => Object.fromEntries(segments.map(([key, , test]) => [key, found.filter(test).length])) as Record<Segment, number>,
    [found],
  );

  const visible = useMemo(() => {
    const test = segments.find(([key]) => key === segment)![2];
    const get = sortValue[sort.key];
    // Vazios ficam sempre no fim, qualquer que seja a direção.
    return found.filter(test).sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [found, segment, sort]);

  // Só conta como selecionado o que está na tela (a busca ou o filtro podem esconder alguns).
  const chosen = visible.filter((o) => selected.has(o.id)).map((o) => o.id);
  const allChosen = chosen.length > 0 && chosen.length === visible.length;
  const archiving = segment !== "arquivados";

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" || key === "cep" ? 1 : -1 }));

  const pickSegment = (key: Segment) => {
    setSegment(key);
    setSelected(new Set());
    setAnchor(null);
  };

  // Shift+clique marca o intervalo desde o último marcado.
  const pick = (index: number, shift: boolean) => {
    const id = visible[index].id;
    const next = new Set(selected);
    const on = !selected.has(id);
    const [from, to] = shift && anchor != null ? [Math.min(anchor, index), Math.max(anchor, index)] : [index, index];
    for (let i = from; i <= to; i++) {
      if (on) next.add(visible[i].id);
      else next.delete(visible[i].id);
    }
    setSelected(next);
    setAnchor(index);
  };

  const pickAll = () => setSelected(allChosen ? new Set() : new Set(visible.map((o) => o.id)));

  // só pedidos pagos (e não arquivados) podem ser entregues
  const deliverable = visible.filter((o) => selected.has(o.id) && deliveryOf(o)).map((o) => o.id);

  const bulk = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      setError("");
      try {
        await fn();
        setSelected(new Set());
        setAnchor(null);
      } catch {
        setError("Não deu para salvar. Tente de novo.");
      }
    });

  const sortLabel = sortOptions.find(([k, d]) => k === sort.key && d === sort.dir)?.[2];

  return (
    <>
      <div className="flex min-h-[60px] flex-wrap items-center justify-between gap-3 px-5 pb-2 pt-4">
        {chosen.length ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold">
              {chosen.length} {chosen.length === 1 ? "pedido selecionado" : "pedidos selecionados"}
            </span>
            {deliverable.length > 0 && (
              <select
                aria-label="Mover entrega dos selecionados"
                value=""
                disabled={pending}
                onChange={(e) => {
                  const status = e.target.value as DeliveryStatus;
                  if (status) bulk(() => updateDeliveryAction(deliverable, { status }));
                }}
                className={`${bulkBtn} cursor-pointer appearance-none pr-3`}
              >
                <option value="">Mover entrega para…{deliverable.length < chosen.length ? ` (${deliverable.length} pagos)` : ""}</option>
                {deliveryOrder.map((d) => (
                  <option key={d} value={d}>
                    {deliveryStyle[d][0]}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={() => bulk(() => archiveOrdersAction(chosen, archiving))} disabled={pending} className={bulkBtn}>
              {archiving ? <Archive className="size-3.5" /> : <ArchiveRestore className="size-3.5" />}
              {pending ? "Salvando…" : archiving ? "Arquivar" : "Desarquivar"}
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-[12px] text-tinta-suave hover:text-tinta hover:underline">
              Limpar seleção
            </button>
            {error && <span className="text-[12px] text-coragem">{error}</span>}
          </div>
        ) : (
          <label className="flex h-9 w-80 items-center gap-2 rounded-lg border border-tinta/12 bg-white px-3 focus-within:border-verdade/40">
            <Search className="size-3.5 shrink-0 text-[#9a938c]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nome, telefone, CEP, cidade, cor, NSU…"
              aria-label="Buscar pedidos"
              className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9a938c]"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Limpar busca" className="text-[#9a938c] hover:text-tinta">
                <X className="size-3.5" />
              </button>
            )}
          </label>
        )}
        <label className="relative flex items-center gap-2 text-[13px] text-tinta">
          <ArrowUpDown className="size-3.5 text-tinta-suave" />
          <span>{sortLabel ?? `${columns.find(([k]) => k === sort.key)?.[1]}, ${sort.dir === 1 ? "crescente" : "decrescente"}`}</span>
          <ChevronDown className="size-3.5 text-tinta-suave" />
          <select
            aria-label="Ordenar pedidos"
            value={sortLabel ? `${sort.key}:${sort.dir}` : ""}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":");
              setSort({ key: key as SortKey, dir: Number(dir) as 1 | -1 });
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {!sortLabel && <option value="">Ordem pela coluna</option>}
            {sortOptions.map(([k, d, label]) => (
              <option key={label} value={`${k}:${d}`}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 px-5 pb-4">
        {segments.map(([key, label]) => {
          const active = key === segment;
          return (
            <Fragment key={key}>
            {key === `entrega:${deliveryOrder[0]}` && (
              <span className="ml-2 self-center text-[10px] font-semibold uppercase tracking-wider text-[#9a938c]">Entrega</span>
            )}
            {key === "arquivados" && <span className="mx-1 w-px self-stretch bg-tinta/10" aria-hidden />}
            <button
              type="button"
              onClick={() => pickSegment(key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                active ? "bg-tinta text-white" : "bg-tinta/[0.045] text-tinta hover:bg-tinta/[0.08]"
              }`}
            >
              {label}
              <span className={`tabular-nums ${active ? "text-white/65" : "text-[#9a938c]"}`}>{counts[key]}</span>
            </button>
            </Fragment>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-1 border-t border-tinta/8 px-5 py-14 text-center">
          <p className="font-serif text-xl">{q ? `Nenhum pedido para “${q}”.` : "Nenhum pedido neste filtro."}</p>
          <p className="text-[13px] text-tinta-suave">
            {q
              ? "Dá para buscar por nome, telefone, #pedido, CEP, cidade, bairro, cor, forma ou NSU."
              : segment === "arquivados"
                ? "Selecione pedidos de teste em Todos e use Arquivar."
                : "Troque o filtro acima para ver os outros pedidos."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-tinta/8">
          <table className="w-full min-w-[1100px]">
            <thead className="border-b border-tinta/8 bg-[#FAF8F5]">
              <tr>
                <th className={`${th} w-0 !pr-1`}>
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={allChosen}
                    ref={(el) => {
                      if (el) el.indeterminate = chosen.length > 0 && !allChosen;
                    }}
                    onChange={pickAll}
                    className={checkbox}
                  />
                </th>
                {columns.map(([key, label, align = ""], i) => (
                  <th key={i} className={`${th} ${align}`} aria-sort={key && sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
                    {key ? (
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className={`group inline-flex items-center gap-1 uppercase tracking-wider hover:text-tinta ${sort.key === key ? "text-tinta" : ""}`}
                      >
                        {label}
                        {sort.key === key ? (
                          sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-0 transition group-hover:opacity-60" />
                        )}
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tinta/6">
              {visible.map((o, i) => {
                const [label, cls] = statusStyle[o.status];
                const a = o.address;
                const on = selected.has(o.id);
                return (
                  <tr
                    key={o.id}
                    onClick={(e) => {
                      // checkbox, links e botões da linha fazem a própria ação
                      if (!(e.target as HTMLElement).closest("input, a, button, form, select")) setOpenId(o.id);
                    }}
                    className={`cursor-pointer ${
                      openId === o.id ? "bg-verdade/[0.07]" : on ? "bg-verdade/[0.04]" : "hover:bg-[#FCFBF9]"
                    }`}
                  >
                    <td className={`${td} w-0 !pr-1`}>
                      <input
                        type="checkbox"
                        aria-label={`Selecionar pedido #${o.id}`}
                        checked={on}
                        onChange={() => {}}
                        onClick={(e) => pick(i, e.shiftKey)}
                        className={checkbox}
                      />
                    </td>
                    <td className={td}>
                      <button type="button" onClick={() => setOpenId(o.id)} className="font-medium hover:underline">
                        #{o.id}
                      </button>
                      <span className={`${sub} whitespace-nowrap`}>{fmtDate.format(o.createdAt)}</span>
                    </td>
                    <td className={td}>
                      <span className="font-medium">{o.name ?? "—"}</span>
                      <span className={`${sub} whitespace-nowrap`}>
                        {o.phone ? formatPhone(o.phone) : ""}
                        {o.orderNumber ? ` · ${o.orderNumber}` : ""}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {o.boxColor ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full ring-1 ring-tinta/10" style={{ background: boxStyle[o.boxColor][1] }} />
                          {boxStyle[o.boxColor][0]}
                        </span>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className={`${td} min-w-[220px]`}>
                      {a ? (
                        <>
                          <span className="font-medium tabular-nums">{fmtCep(a.cep)}</span>
                          <span className={`${sub} max-w-[280px]`}>
                            {a.street}, {a.number}
                            {a.complement ? ` · ${a.complement}` : ""} · {a.neighborhood} · {a.city}/{a.state}
                          </span>
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{optionLabel(o)}</td>
                    <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{brl(o.amount)}</td>
                    <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{o.paidAmount != null ? brl(o.paidAmount) : dash}</td>
                    <td className={`${td} whitespace-nowrap`}>{methodLabel(o) || dash}</td>
                    <td className={td}>
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
                    </td>
                    <td className={td}>
                      {deliveryOf(o) ? (
                        <>
                          <select
                            aria-label={`Entrega do pedido #${o.id}`}
                            value={deliveryOf(o)!}
                            disabled={pending}
                            onChange={(e) => bulk(() => updateDeliveryAction([o.id], { status: e.target.value as DeliveryStatus }))}
                            className={`${deliverySelect} ${deliveryStyle[deliveryOf(o)!][1]}`}
                            style={{ backgroundImage: chevron }}
                          >
                            {deliveryOrder.map((d) => (
                              <option key={d} value={d}>
                                {deliveryStyle[d][0]}
                              </option>
                            ))}
                          </select>
                          {(o.carrier || o.deliveryOwner || o.deliveredAt) && (
                            <span className={`${sub} mt-1 whitespace-nowrap`}>
                              {[o.carrier, o.deliveryOwner, deliveryOf(o) === "entregue" && o.deliveredAt && fmtDay.format(o.deliveredAt)]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                          {o.complaint && (
                            <span className="mt-1 flex max-w-[180px] items-start gap-1 text-[11px] text-[#A2402B]" title={o.complaint}>
                              <MessageSquareWarning className="mt-px size-3 shrink-0" />
                              <span className="truncate">{o.complaint}</span>
                            </span>
                          )}
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{o.checkedAt ? fmtDate.format(o.checkedAt) : dash}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <div className="flex items-center gap-3">
                        {o.receiptUrl && (
                          <a href={o.receiptUrl} target="_blank" rel="noreferrer" className="text-[11px] text-recomeco hover:underline">
                            Comprovante
                          </a>
                        )}
                        {o.transactionNsu && (
                          <form action={recheckOrdersAction}>
                            <input type="hidden" name="orderId" value={o.id} />
                            <button className="text-[11px] text-tinta-suave hover:text-tinta hover:underline">Conferir</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {openOrder && <PedidoDrawer key={openOrder.id} order={openOrder} onClose={closeDrawer} />}
    </>
  );
}
