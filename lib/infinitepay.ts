import "server-only";
import { produto } from "./site";

// Checkout da InfinitePay (link de pagamento via API). Docs: https://www.infinitepay.io/checkout-documentacao
// Precisa da InfiniteTag (INFINITEPAY_HANDLE, sem o "$") e da chave da API (INFINITEPAY_API_KEY, "inchk_..."):
// sem a chave, a InfinitePay ignora as `options`. O webhook não é assinado: todo aviso é confirmado em
// /payment_check antes de marcar a compra.
const API = "https://api.checkout.infinitepay.io";

// A InfinitePay não deixa desligar o cartão (payment_methods_enabled: ["pix"] é ignorado). Então todo link
// cobra o preço do cartão, em até 3x com as taxas por nossa conta, e dá no Pix o desconto que leva ao
// preço à vista.
const { a_vista: pix, parcelado: card } = produto.precoCentavos;
const options = {
  assured_installments: 3,
  single_payment: true,
  discounts: { pix: Number(((1 - pix / card) * 100).toFixed(6)) },
};

function headers() {
  return { "Content-Type": "application/json", "X-Api-Key": process.env.INFINITEPAY_API_KEY! };
}

export function infinitepayConfigured(): boolean {
  return Boolean(process.env.INFINITEPAY_HANDLE && process.env.INFINITEPAY_API_KEY);
}

export async function createCheckoutLink(input: {
  orderId: number;
  amount: number;
  name: string;
  phone: string;
  paymentPreference: "a_vista" | "parcelado";
}): Promise<string> {
  // o resumo do checkout mostra o preço do cartão; a descrição avisa já na primeira tela o preço escolhido
  const price = input.paymentPreference === "a_vista" ? `${produto.precoAVista} no Pix` : `${produto.parcelas} sem juros`;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${API}/links`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      handle: process.env.INFINITEPAY_HANDLE,
      items: [
        {
          quantity: 1,
          price: input.amount,
          description: `${produto.nome} · ${produto.edicao} · ${price}`,
        },
      ],
      order_nsu: `pedido-${input.orderId}`,
      webhook_url: `${site}/api/infinitepay/webhook`,
      customer: { name: input.name, phone_number: `+${input.phone}` },
      options,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok || !data.url) throw new Error(`InfinitePay: ${data.message ?? `HTTP ${res.status}`}`);
  return data.url;
}

export type PaymentCheck = {
  paid: boolean;
  amount?: number;
  paidAmount?: number;
  installments?: number;
  captureMethod?: string;
};

export async function checkPayment(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<PaymentCheck> {
  const res = await fetch(`${API}/payment_check`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      handle: process.env.INFINITEPAY_HANDLE,
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    paid?: boolean;
    amount?: number;
    paid_amount?: number;
    installments?: number;
    capture_method?: string;
  };
  return {
    paid: res.ok && data.success === true && data.paid === true,
    amount: data.amount,
    paidAmount: data.paid_amount,
    installments: data.installments,
    captureMethod: data.capture_method,
  };
}
