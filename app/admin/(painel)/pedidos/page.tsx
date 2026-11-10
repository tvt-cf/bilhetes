import { RefreshCw } from "lucide-react";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { infinitepayConfigured } from "@/lib/infinitepay";
import { getOrderTotals, listOrders } from "@/lib/orders";
import { recheckOrdersAction } from "../../actions";
import { btnSecondary, Card, PageHeader } from "../ui";
import { TabelaPedidos } from "./tabela";

const fmt = new Intl.NumberFormat("pt-BR");
const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PedidosPage({ searchParams }: PageProps<"/admin/pedidos">) {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Pedidos" subtitle="Cada checkout aberto na InfinitePay e o que ela confirmou de pagamento. Os pagamentos chegam pelo webhook.">
        <form action={recheckOrdersAction}>
          <button className={btnSecondary}>
            <RefreshCw className="size-4" /> Conferir pagamentos na InfinitePay
          </button>
        </form>
      </PageHeader>
      <Suspense fallback={<Card className="h-[560px] animate-pulse" />}>
        <Pedidos searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Pedidos({ searchParams }: { searchParams: PageProps<"/admin/pedidos">["searchParams"] }) {
  await requireAdmin();
  const pedido = Number((await searchParams).pedido) || undefined;
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
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-tinta-suave">Nenhum pedido ainda.</p>
        ) : (
          <TabelaPedidos rows={rows} initialOpenId={pedido} />
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
