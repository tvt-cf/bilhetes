"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { BoxColor, DeliveryAddress, OrderStatus } from "@/lib/db/schema";
import { formatPhone } from "@/lib/phone";
import { recheckOrdersAction } from "../../actions";

export type OrderRow = {
  id: number;
  name: string | null;
  phone: string | null;
  orderNumber: string | null;
  paymentPreference: "a_vista" | "parcelado";
  boxColor: BoxColor | null;
  address: DeliveryAddress | null;
  amount: number;
  status: OrderStatus;
  paidAmount: number | null;
  installments: number | null;
  captureMethod: string | null;
  transactionNsu: string | null;
  receiptUrl: string | null;
  checkedAt: Date | null;
  createdAt: Date;
};

const statusStyle: Record<OrderStatus, [string, string]> = {
  aguardando: ["Aguardando", "bg-luz/20 text-[#7A5A1E]"],
  pago: ["Pago", "bg-presenca/15 text-[#4F5636]"],
  divergente: ["Divergente", "bg-coragem/12 text-[#A2402B]"],
};

const boxStyle: Record<BoxColor, [string, string]> = {
  clara: ["Clara", "#C9A06A"],
  escura: ["Escura", "#5B3B27"],
};

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
const fmtCep = (cep: string) => cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
const optionLabel = (o: OrderRow) => (o.paymentPreference === "a_vista" ? "À vista" : "Parcelado");
const methodLabel = (o: OrderRow) =>
  o.captureMethod === "pix"
    ? "Pix"
    : o.captureMethod === "credit_card"
      ? `Cartão${o.installments ? ` ${o.installments}x` : ""}`
      : "";

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
      o.transactionNsu,
      fmtDate.format(o.createdAt),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

type SortKey = "id" | "name" | "box" | "cep" | "option" | "amount" | "paid" | "method" | "status" | "checked";

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
  ["checked", "Conferido"],
  [null, ""],
];

const th = "px-2.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9a938c] first:pl-5 last:pr-5";
const td = "px-2.5 py-2.5 align-top text-[12px] leading-snug first:pl-5 last:pr-5";
const sub = "block text-[11px] text-tinta-suave";
const dash = <span className="text-[#c4bdb5]">—</span>;

export function TabelaPedidos({ rows }: { rows: OrderRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "id", dir: -1 });

  const indexed = useMemo(() => rows.map((o) => ({ o, text: haystack(o) })), [rows]);

  const visible = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const found = terms.length ? indexed.filter(({ text }) => terms.every((t) => text.includes(t))) : indexed;
    const get = sortValue[sort.key];
    // Vazios ficam sempre no fim, qualquer que seja a direção.
    return found
      .map(({ o }) => o)
      .sort((a, b) => {
        const va = get(a);
        const vb = get(b);
        if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
      });
  }, [indexed, q, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" || key === "cep" ? 1 : -1 }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tinta/8 px-5 py-3">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-[14px] font-semibold">Pedidos</h2>
          <span className="text-[12px] text-tinta-suave">
            {q ? `${visible.length} de ${rows.length}` : rows.length}
          </span>
        </div>
        <label className="flex w-80 items-center gap-2 rounded-lg bg-leveza px-3 py-1.5 focus-within:ring-1 focus-within:ring-verdade/30">
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
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-1 px-5 py-14 text-center">
          <p className="font-serif text-xl">Nenhum pedido para “{q}”.</p>
          <p className="text-[13px] text-tinta-suave">Dá para buscar por nome, telefone, #pedido, CEP, cidade, bairro, cor, forma ou NSU.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead className="border-b border-tinta/8 bg-[#FAF8F5]">
              <tr>
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
              {visible.map((o) => {
                const [label, cls] = statusStyle[o.status];
                const a = o.address;
                return (
                  <tr key={o.id} className="hover:bg-[#FCFBF9]">
                    <td className={td}>
                      <span className="font-medium">#{o.id}</span>
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
                    <td className={td}>
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
    </>
  );
}
