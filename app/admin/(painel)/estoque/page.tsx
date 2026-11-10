import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import type { BoxColor } from "@/lib/db/schema";
import { boxColors, getStockLive, getWaitlistDemand, listStockLots } from "@/lib/stock";
import { addStockLotAction, setSoldOutAction } from "../../actions";
import { boxStyle } from "../pedidos/format";
import { btnPrimary, Card, PageHeader, td, th } from "../ui";

const fmt = new Intl.NumberFormat("pt-BR");
const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default function EstoquePage() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Estoque"
        subtitle="Caixas por cor. Cada pedido pago desconta uma caixa, entregue ou não; a entrega só muda de reservada para entregue."
      />
      <Suspense fallback={<Card className="h-[560px] animate-pulse" />}>
        <Estoque />
      </Suspense>
    </div>
  );
}

async function Estoque() {
  await requireAdmin();
  const [stock, demand, lots] = await Promise.all([getStockLive(), getWaitlistDemand(), listStockLots()]);
  const waiting = demand.clara + demand.escura + demand.semCor;

  const siteState = stock.manual
    ? ["Esgotado (marcado à mão)", "O site mostra a fila de espera até você reabrir as vendas.", "bg-coragem"]
    : stock.soldOut
      ? [
          "Esgotado",
          "Nenhuma caixa disponível nas duas cores: o site mostra a fila de espera. Registre um lote para voltar a vender.",
          "bg-coragem",
        ]
      : [
          "À venda",
          boxColors.some((c) => stock.colorSoldOut[c])
            ? `A caixa ${boxColors.find((c) => stock.colorSoldOut[c])} aparece como esgotada no checkout.`
            : "As duas cores estão disponíveis no checkout.",
          "bg-[#6FCF8A]",
        ];

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${siteState[2]}`} />
          <div>
            <p className="text-sm font-semibold">{siteState[0]}</p>
            <p className="text-xs text-tinta-suave">{siteState[1]}</p>
          </div>
        </div>
        <form action={setSoldOutAction}>
          <input type="hidden" name="soldOut" value={stock.manual ? "0" : "1"} />
          <button
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              stock.manual ? "bg-presenca text-white hover:bg-presenca/90" : "border border-coragem/40 text-coragem hover:bg-coragem/5"
            }`}
          >
            {stock.manual ? "Reabrir vendas" : "Marcar como esgotado"}
          </button>
        </form>
      </Card>


      <div className="grid gap-4 lg:grid-cols-2">
        {boxColors.map((c) => (
          <ColorCard key={c} color={c} stock={stock.colors[c]} soldOut={stock.colorSoldOut[c]} waiting={demand[c]} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-[15px] font-semibold">Registrar lote</h2>
            <p className="text-xs text-tinta-suave">
              Chegou caixa nova? Some aqui. Para corrigir uma contagem, use um número negativo (ex.: −2).
            </p>
          </div>
          <form action={addStockLotAction} className="flex flex-col gap-3">
            <div className="flex gap-2">
              {boxColors.map((c, i) => (
                <label
                  key={c}
                  className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-tinta/15 px-3 py-2.5 text-[13px] has-[:checked]:border-verdade has-[:checked]:bg-verdade/5 has-[:checked]:font-semibold"
                >
                  <input type="radio" name="boxColor" value={c} defaultChecked={i === 0} className="accent-verdade" />
                  <span className="size-2.5 rounded-full" style={{ background: boxStyle[c][1] }} />
                  {boxStyle[c][0]}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                name="quantity"
                type="number"
                required
                step={1}
                placeholder="Quantidade"
                className="h-10 w-32 rounded-lg border border-tinta/15 px-3 text-[13px] tabular-nums outline-none focus:border-verdade/40"
              />
              <input
                name="note"
                placeholder="Observação (ex.: lote 2, marcenaria)"
                maxLength={200}
                className="h-10 min-w-0 flex-1 rounded-lg border border-tinta/15 px-3 text-[13px] outline-none focus:border-verdade/40"
              />
            </div>
            <button className={`${btnPrimary} self-start`}>Adicionar ao estoque</button>
          </form>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-[15px] font-semibold">Fila de espera · próxima produção</h2>
            <p className="text-xs text-tinta-suave">
              {fmt.format(waiting)} {waiting === 1 ? "pessoa esperando" : "pessoas esperando"}. Quem tentou comprar de fora da Grande SP
              já escolheu a cor; quem chegou com o site esgotado ainda não.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["Clara", demand.clara, boxStyle.clara[1]],
                ["Escura", demand.escura, boxStyle.escura[1]],
                ["Sem cor escolhida", demand.semCor, null],
              ] as const
            ).map(([label, n, swatch]) => (
              <div key={label} className="flex flex-col gap-1 rounded-lg bg-leveza px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[11px] text-tinta-suave">
                  {swatch && <span className="size-2 rounded-full" style={{ background: swatch }} />}
                  {label}
                </span>
                <span className="font-serif text-[26px] leading-none">{fmt.format(n)}</span>
              </div>
            ))}
          </div>
          {demand.cities.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9a938c]">Cidades fora da área que mais pedem</span>
              <div className="flex flex-wrap gap-1.5">
                {demand.cities.map((c) => (
                  <span key={c.city} className="rounded-md border border-tinta/12 px-2 py-0.5 text-[12px]">
                    {c.city} <span className="text-tinta-suave">{c.n}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-tinta/8 px-5 py-4">
          <h2 className="text-[15px] font-semibold">Histórico de lotes</h2>
        </div>
        {lots.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-tinta-suave">Nenhum lote registrado.</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-tinta/8 bg-[#FAF8F5]">
              <tr>
                {["DATA", "COR", "QUANTIDADE", "OBSERVAÇÃO", "QUEM REGISTROU"].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tinta/6">
              {lots.map((l) => (
                <tr key={l.id}>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate.format(l.createdAt)}</td>
                  <td className={td}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: boxStyle[l.boxColor][1] }} />
                      {boxStyle[l.boxColor][0]}
                    </span>
                  </td>
                  <td className={`${td} tabular-nums font-medium ${l.quantity < 0 ? "text-coragem" : ""}`}>
                    {l.quantity > 0 ? `+${fmt.format(l.quantity)}` : `−${fmt.format(-l.quantity)}`}
                  </td>
                  <td className={`${td} text-tinta-suave`}>{l.note ?? "—"}</td>
                  <td className={`${td} text-tinta-suave`}>{l.actor ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

function ColorCard({
  color,
  stock,
  soldOut,
  waiting,
}: {
  color: BoxColor;
  stock: { total: number; reserved: number; delivered: number; available: number };
  soldOut: boolean;
  waiting: number;
}) {
  const [name, swatch] = boxStyle[color];
  const base = Math.max(stock.total, stock.reserved + stock.delivered, 1);
  const pct = (n: number) => `${(n / base) * 100}%`;
  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-[15px] font-semibold">
          <span className="size-3.5 rounded-full ring-1 ring-tinta/10" style={{ background: swatch }} />
          Caixa {name.toLowerCase()}
        </span>
        {soldOut && <span className="rounded-full bg-coragem/12 px-2.5 py-1 text-[11px] font-semibold text-[#A2402B]">Esgotada no site</span>}
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-tinta-suave">Disponível para venda</span>
          <span className="font-serif text-[48px] leading-none">{fmt.format(stock.available)}</span>
        </div>
        <span className="text-right text-xs text-tinta-suave">
          {fmt.format(waiting)} na fila de espera
          <br />
          escolheram esta cor
        </span>
      </div>
      {/* barra: entregues | reservados | disponível, sobre o total recebido */}
      <div className="flex h-2 overflow-hidden rounded-full bg-tinta/8">
        <div className="bg-verdade" style={{ width: pct(stock.delivered) }} />
        <div className="bg-luz" style={{ width: pct(stock.reserved) }} />
        <div className="bg-presenca/50" style={{ width: pct(stock.available) }} />
      </div>
      <dl className="grid grid-cols-3 gap-3 text-[12px]">
        {(
          [
            ["Total recebido", stock.total, "bg-tinta/20"],
            ["Reservados", stock.reserved, "bg-luz", "pagos, a entregar"],
            ["Entregues", stock.delivered, "bg-verdade"],
          ] as const
        ).map(([label, n, dot, hint]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-1.5 text-tinta-suave">
              <span className={`size-2 rounded-full ${dot}`} />
              {label}
            </dt>
            <dd className="text-[18px] font-medium tabular-nums">{fmt.format(n)}</dd>
            {hint && <span className="text-[11px] text-tinta-suave">{hint}</span>}
          </div>
        ))}
      </dl>
    </Card>
  );
}
