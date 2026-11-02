import { RefreshCw } from "lucide-react";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/db/schema";
import { infinitepayConfigured } from "@/lib/infinitepay";
import { getOrderTotals, listOrders } from "@/lib/orders";
import { formatPhone } from "@/lib/phone";
import { recheckOrdersAction } from "../../actions";
import { btnSecondary, Card, PageHeader, td, th } from "../ui";

const statusStyle: Record<OrderStatus, [string, string]> = {
  aguardando: ["Aguardando", "bg-luz/20 text-[#7A5A1E]"],
  pago: ["Pago", "bg-presenca/15 text-[#4F5636]"],
  divergente: ["Divergente", "bg-coragem/12 text-[#A2402B]"],
};

const fmt = new Intl.NumberFormat("pt-BR");
const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default function PedidosPage() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Pedidos" subtitle="Cada checkout aberto na InfinitePay e o que ela confirmou de pagamento.">
        <form action={recheckOrdersAction}>
          <button className={btnSecondary}>
            <RefreshCw className="size-4" /> Conferir pagamentos na InfinitePay
          </button>
        </form>
      </PageHeader>
      <Suspense fallback={<Card className="h-[560px] animate-pulse" />}>
        <Pedidos />
      </Suspense>
    </div>
  );
}

async function Pedidos() {
  await requireAdmin();
  const [totals, rows] = await Promise.all([getOrderTotals(), listOrders()]);

  return (
    <>
      {!infinitepayConfigured() && (
        <Card className="px-5 py-4 text-sm text-coragem">
          InfinitePay desligada: configure INFINITEPAY_HANDLE e INFINITEPAY_API_KEY. Até lá, “Eu quero” só registra a
          reserva e nenhum pedido é criado.
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Pedidos pagos" value={fmt.format(totals.paid)} sub={`${fmt.format(totals.pix)} no Pix · ${fmt.format(totals.card)} no cartão`} />
        <Kpi label="Recebido" value={brl(totals.received)} sub={`Esperado pelos pedidos pagos: ${brl(totals.expected)}`} />
        <Kpi
          label="Checkouts sem pagamento"
          value={fmt.format(totals.waiting)}
          sub={`de ${fmt.format(totals.total)} checkouts abertos`}
        />
        <Kpi
          label="Divergentes"
          value={fmt.format(totals.divergent)}
          sub={totals.divergent ? "Valor diferente ou pagamento não confirmado" : "Tudo batendo com a InfinitePay"}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-tinta/8 px-5 py-4">
          <h2 className="text-[15px] font-semibold">Pedidos</h2>
          <span className="text-[13px] text-tinta-suave">Pagamentos chegam pelo webhook e são conferidos na InfinitePay</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-tinta-suave">Nenhum pedido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b border-tinta/8 bg-[#FAF8F5]">
                <tr>
                  {["PEDIDO", "PESSOA", "OPÇÃO", "COBRADO", "PAGO", "FORMA", "STATUS", "CONFERIDO", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta/6">
                {rows.map((o) => {
                  const [label, cls] = statusStyle[o.status];
                  return (
                    <tr key={o.id}>
                      <td className={td}>
                        <span className="font-medium">#{o.id}</span>
                        <span className="block text-xs text-tinta-suave">{fmtDate.format(o.createdAt)}</span>
                      </td>
                      <td className={td}>
                        <span className="font-medium">{o.name ?? "—"}</span>
                        <span className="block text-xs text-tinta-suave">
                          {o.phone ? formatPhone(o.phone) : ""}
                          {o.orderNumber ? ` · ${o.orderNumber}` : ""}
                        </span>
                      </td>
                      <td className={td}>{o.paymentPreference === "a_vista" ? "À vista" : "Parcelado"}</td>
                      <td className={td}>{brl(o.amount)}</td>
                      <td className={td}>{o.paidAmount != null ? brl(o.paidAmount) : "—"}</td>
                      <td className={td}>
                        {o.captureMethod === "pix"
                          ? "Pix"
                          : o.captureMethod === "credit_card"
                            ? `Cartão${o.installments ? ` ${o.installments}x` : ""}`
                            : "—"}
                      </td>
                      <td className={td}>
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
                          {label}
                        </span>
                      </td>
                      <td className={td}>{o.checkedAt ? fmtDate.format(o.checkedAt) : "—"}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        <div className="flex items-center gap-3">
                          {o.receiptUrl && (
                            <a href={o.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-recomeco hover:underline">
                              Comprovante
                            </a>
                          )}
                          {o.transactionNsu && (
                            <form action={recheckOrdersAction}>
                              <input type="hidden" name="orderId" value={o.id} />
                              <button className="text-xs text-tinta-suave hover:text-tinta hover:underline">Conferir</button>
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
      </Card>
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <span className="text-[13px] text-tinta-suave">{label}</span>
      <span className="font-serif text-[40px] leading-none">{value}</span>
      <span className="text-xs text-tinta-suave">{sub}</span>
    </Card>
  );
}
