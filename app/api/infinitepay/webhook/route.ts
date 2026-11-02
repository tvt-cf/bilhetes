import { revalidateTag } from "next/cache";
import { markPaid } from "@/lib/community";
import { isPaid } from "@/lib/infinitepay";
import { STOCK_TAG } from "@/lib/stock";

type WebhookBody = { order_nsu?: string; transaction_nsu?: string; invoice_slug?: string };

// A InfinitePay chama aqui quando o pagamento é aprovado. Fora de 2xx, ela tenta de novo.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as WebhookBody;
  const { order_nsu, transaction_nsu, invoice_slug } = body;
  if (!order_nsu || !transaction_nsu || !invoice_slug) return new Response("bad request", { status: 400 });

  // sem assinatura no webhook: só confia no que a própria InfinitePay confirmar
  if (!(await isPaid({ orderNsu: order_nsu, transactionNsu: transaction_nsu, slug: invoice_slug }))) {
    return new Response("not paid", { status: 400 });
  }
  await markPaid(Number(order_nsu));
  revalidateTag(STOCK_TAG, { expire: 0 }); // a venda pode ter esgotado a edição
  return Response.json({ ok: true });
}
