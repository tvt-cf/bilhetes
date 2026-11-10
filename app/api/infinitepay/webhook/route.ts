import { revalidateTag } from "next/cache";
import { reconcileOrder } from "@/lib/orders";
import { STOCK_TAG } from "@/lib/stock";

type WebhookBody = { order_nsu?: string; transaction_nsu?: string; invoice_slug?: string; receipt_url?: string };

// A InfinitePay chama aqui quando o pagamento é aprovado. Fora de 2xx, ela tenta de novo.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as WebhookBody;
  const { order_nsu, transaction_nsu, invoice_slug, receipt_url } = body;
  if (!order_nsu || !transaction_nsu || !invoice_slug) return new Response("bad request", { status: 400 });

  // sem assinatura no webhook: só vale o que a própria InfinitePay confirmar em /payment_check
  const status = await reconcileOrder({
    orderNsu: order_nsu,
    transactionNsu: transaction_nsu,
    slug: invoice_slug,
    receiptUrl: receipt_url,
    via: "webhook",
  });
  if (status === null) return Response.json({ ok: true, ignored: "pedido desconhecido" }); // 2xx: não adianta repetir
  if (status === "nao_pago") return new Response("not paid", { status: 400 });
  if (status === "pago") revalidateTag(STOCK_TAG, { expire: 0 }); // a venda pode ter esgotado a edição
  return Response.json({ ok: true, status });
}
