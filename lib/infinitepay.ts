import "server-only";
import { produto } from "./site";

// Checkout da InfinitePay (link de pagamento via API). Docs: https://www.infinitepay.io/checkout-documentacao
// Só precisa da InfiniteTag (INFINITEPAY_HANDLE, sem o "$"). O webhook não é assinado: todo aviso é
// confirmado em /payment_check antes de marcar a compra.
const API = "https://api.checkout.infinitepay.io";

export function infinitepayConfigured(): boolean {
  return Boolean(process.env.INFINITEPAY_HANDLE);
}

export async function createCheckoutLink(input: {
  personId: number;
  name: string;
  phone: string;
  paymentPreference: "a_vista" | "parcelado";
}): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${API}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: process.env.INFINITEPAY_HANDLE,
      items: [
        {
          quantity: 1,
          price: produto.precoCentavos[input.paymentPreference],
          description: `${produto.nome} · ${produto.edicao}`,
        },
      ],
      order_nsu: String(input.personId),
      webhook_url: `${site}/api/infinitepay/webhook`,
      customer: { name: input.name, phone_number: `+${input.phone}` },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok || !data.url) throw new Error(`InfinitePay: ${data.message ?? `HTTP ${res.status}`}`);
  return data.url;
}

export async function isPaid(input: { orderNsu: string; transactionNsu: string; slug: string }) {
  const res = await fetch(`${API}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: process.env.INFINITEPAY_HANDLE,
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; paid?: boolean };
  return res.ok && data.success === true && data.paid === true;
}
