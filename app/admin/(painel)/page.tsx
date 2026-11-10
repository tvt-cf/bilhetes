import { Boxes, Download, Search, Send } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getSegmentCounts, getStats, listPeople, type SegmentFilter } from "@/lib/community";
import { formatPhone } from "@/lib/phone";
import { getStockLive } from "@/lib/stock";
import { markPurchasedAction } from "../actions";
import { btnPrimary, btnSecondary, Card, DeliveryText, PageHeader, sourceLabel, StatusBadge, td, th } from "./ui";

const tabs: [SegmentFilter, string][] = [
  ["todos", "Todos"],
  ["comunidade", "Só comunidade"],
  ["fila_espera", "Fila de espera"],
  ["pre_venda", "Pré-venda"],
  ["comprou", "Compraram"],
  ["descadastrados", "Descadastrados"],
];

const fmt = new Intl.NumberFormat("pt-BR");
const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents % 100 ? 2 : 0 });
const orderStatusLabel: Record<string, string> = { aguardando: "aguardando pagamento", pago: "pago", divergente: "divergente" };
const fmtDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

export default function ComunidadePage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Comunidade"
        subtitle="Quem deixou o WhatsApp, entrou na pré-venda ou comprou o Oráculo."
      >
        <a href="/admin/export" className={btnSecondary}>
          <Download className="size-4" /> Exportar CSV
        </a>
        <Link href="/admin/mensagens" className={btnPrimary}>
          <Send className="size-4" /> Nova mensagem
        </Link>
      </PageHeader>
      <Suspense fallback={<Card className="h-[560px] animate-pulse" />}>
        <Comunidade searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Comunidade({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();
  const params = await searchParams;
  const segment = (tabs.find(([k]) => k === params.segmento)?.[0] ?? "todos") as SegmentFilter;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const [stats, counts, rows, stock] = await Promise.all([
    getStats(),
    getSegmentCounts(),
    listPeople({ segment, q }),
    getStockLive(),
  ]);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${stock.soldOut ? "bg-coragem" : "bg-[#6FCF8A]"}`} />
          <div>
            <p className="text-sm font-semibold">
              {stock.soldOut ? "Esgotado: o site mostra a fila de espera" : "À venda: o site mostra “Eu quero”"}
            </p>
            <p className="text-xs text-tinta-suave">
              {`${fmt.format(stock.colors.clara.available)} claras e ${fmt.format(stock.colors.escura.available)} escuras disponíveis`}
              {` · ${fmt.format(stats.waitlist)} ${stats.waitlist === 1 ? "pessoa" : "pessoas"} na fila de espera`}
            </p>
          </div>
        </div>
        <Link href="/admin/estoque" className={btnSecondary}>
          <Boxes className="size-4" /> Ver estoque
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Cadastrados no WhatsApp" value={stats.total} sub={`+${fmt.format(stats.lastWeek)} nos últimos 7 dias`} />
        <Kpi label="Pré-venda do Oráculo" value={stats.presale} sub={`${pct(stats.presale, stats.total)}% dos cadastrados`} />
        <Kpi
          label="Compraram"
          value={stats.buyers}
          sub={`${fmt.format(stock.colors.clara.available + stock.colors.escura.available)} caixas disponíveis no estoque`}
        >
          <div className="h-1.5 rounded-full bg-verdade/10">
            <div
              className="h-full rounded-full bg-verdade"
              style={{ width: `${Math.min(pct(stats.buyers, stats.edition), 100)}%` }}
            />
          </div>
        </Kpi>
        <Kpi
          label="Aceitam mensagens de sabedoria"
          value={stats.wisdom}
          sub={`${pct(stats.wisdom, stats.total)}% · ${fmt.format(stats.optedOut)} descadastros`}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tinta/8 px-5 py-3.5">
          <div className="flex flex-wrap gap-1">
            {tabs.map(([key, label]) => {
              const active = key === segment;
              const href = `/admin?segmento=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] ${
                    active ? "bg-verdade/8 font-semibold text-verdade" : "font-medium text-tinta-suave hover:bg-tinta/5"
                  }`}
                >
                  {label}
                  <span className={`text-xs ${active ? "text-verdade" : "text-[#9a938c]"}`}>
                    {fmt.format(counts[key])}
                  </span>
                </Link>
              );
            })}
          </div>
          <form className="flex w-64 items-center gap-2 rounded-lg bg-leveza px-3 py-2 focus-within:ring-1 focus-within:ring-verdade/30">
            <Search className="size-4 shrink-0 text-[#9a938c]" />
            <input type="hidden" name="segmento" value={segment} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar nome ou telefone"
              aria-label="Buscar nome ou telefone"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9a938c]"
            />
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-5 py-16 text-center">
            <p className="font-serif text-2xl">{q ? `Ninguém encontrado para “${q}”.` : "Ninguém neste grupo ainda."}</p>
            <p className="text-sm text-tinta-suave">
              {q ? "Confira o nome ou tente só os últimos dígitos do telefone." : "Quem se cadastrar no site aparece aqui."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-tinta/8 bg-[#FAF8F5]">
                <tr>
                  {["PESSOA", "STATUS", "INTERESSES", "ORIGEM", "PEDIDO", "ÚLTIMA MENSAGEM", "CADASTRO"].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta/6">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-leveza text-xs font-semibold text-verdade">
                          {(p.name ?? "?")
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{p.name ?? "Sem nome"}</p>
                          <p className="text-xs text-tinta-suave">{formatPhone(p.phone)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <StatusBadge status={p.status} optedOut={Boolean(p.optedOutAt)} />
                    </td>
                    <td className={td}>
                      <div className="flex gap-1.5">
                        {p.wantsEvents && <Chip>Eventos</Chip>}
                        {p.wantsWisdom && <Chip>Sabedoria</Chip>}
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {sourceLabel(p.source)}
                      {p.outsideArea && (
                        <span className="block text-xs text-tinta-suave">
                          Fora da Grande SP · {p.outsideArea.city}/{p.outsideArea.uf} · caixa {p.outsideArea.boxColor}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      {p.order?.id ? (
                        <Link href={`/admin/pedidos?pedido=${p.order.id}`} className="group block whitespace-nowrap">
                          <span className="font-medium group-hover:underline">#{p.order.id}</span>
                          <span className="text-tinta-suave">
                            {" "}
                            · {orderStatusLabel[p.order.status] ?? p.order.status}
                            {p.order.delivered ? " · entregue" : ""}
                          </span>
                          <span className="block text-xs text-tinta-suave">
                            {[p.order.boxColor && `Caixa ${p.order.boxColor}`, brl(p.order.amount), p.order.city].filter(Boolean).join(" · ")}
                          </span>
                        </Link>
                      ) : p.orderNumber ? (
                        <span className="font-medium">{p.orderNumber}</span>
                      ) : p.status === "pre_venda" ? (
                        <form action={markPurchasedAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="personId" value={p.id} />
                          <input
                            name="orderNumber"
                            required
                            placeholder="Nº"
                            className="w-14 rounded-md border border-tinta/15 px-2 py-1 text-xs"
                          />
                          <button className="rounded-md bg-presenca px-2 py-1 text-xs font-semibold text-white">
                            Pagou
                          </button>
                        </form>
                      ) : (
                        <span className="text-[#9a938c]">—</span>
                      )}
                    </td>
                    <td className={td}>
                      <DeliveryText title={p.lastTitle} status={p.lastStatus} />
                    </td>
                    <td className={`${td} text-tinta-suave`}>{fmtDate.format(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-tinta/8 px-5 py-3.5 text-[13px] text-tinta-suave">
          Mostrando {fmt.format(rows.length)} de {fmt.format(counts[segment])}
        </p>
      </Card>
    </>
  );
}

function Kpi({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: number;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <span className="text-[13px] text-tinta-suave">{label}</span>
      <span className="font-serif text-[40px] leading-none">{fmt.format(value)}</span>
      {children}
      <span className="text-xs text-tinta-suave">{sub}</span>
    </Card>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-tinta/15 px-2 py-0.5 text-xs">{children}</span>;
}
