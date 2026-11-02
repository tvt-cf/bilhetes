import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getSegmentCounts, getStats, listPeople, type SegmentFilter } from "@/lib/community";
import { formatPhone } from "@/lib/phone";
import { markPurchasedAction } from "../actions";
import { Card, DeliveryText, PageHeader, StatusBadge, td, th } from "./ui";

const tabs: [SegmentFilter, string][] = [
  ["todos", "Todos"],
  ["comunidade", "Só comunidade"],
  ["pre_venda", "Pré-venda"],
  ["comprou", "Compraram"],
  ["descadastrados", "Descadastrados"],
];

const fmt = new Intl.NumberFormat("pt-BR");
const fmtDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

export default function ComunidadePage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Comunidade"
        subtitle="Quem deixou o WhatsApp, entrou na pré-venda ou comprou o Oráculo."
      >
        <a
          href="/admin/export"
          className="rounded-lg border border-tinta/15 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-tinta/30"
        >
          Exportar CSV
        </a>
        <Link
          href="/admin/envios"
          className="rounded-lg bg-verdade px-4 py-2.5 text-sm font-semibold text-leveza transition hover:bg-verdade/90"
        >
          Nova mensagem
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
  const [stats, counts, rows] = await Promise.all([getStats(), getSegmentCounts(), listPeople({ segment, q })]);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Cadastrados no WhatsApp" value={stats.total} sub={`+${fmt.format(stats.lastWeek)} nos últimos 7 dias`} />
        <Kpi label="Pré-venda do Oráculo" value={stats.presale} sub={`${pct(stats.presale, stats.total)}% dos cadastrados`} />
        <Kpi
          label="Compraram"
          value={stats.buyers}
          sub={`${fmt.format(Math.max(stats.edition - stats.buyers, 0))} caixas restantes de ${stats.edition}`}
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
          <form className="flex items-center gap-2">
            <input type="hidden" name="segmento" value={segment} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar nome ou telefone"
              className="w-60 rounded-lg bg-leveza px-3 py-2 text-[13px] outline-none placeholder:text-[#9a938c] focus:ring-1 focus:ring-verdade/30"
            />
          </form>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-tinta-suave">
            {q ? `Ninguém encontrado para “${q}”.` : "Ninguém neste grupo ainda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-tinta/8 bg-[#FAF8F5]">
                <tr>
                  {["PESSOA", "STATUS", "INTERESSES", "ORIGEM", "PEDIDO", "ÚLTIMO ENVIO", "CADASTRO"].map((h) => (
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
                    <td className={`${td} capitalize`}>{p.source}</td>
                    <td className={td}>
                      {p.orderNumber ? (
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
