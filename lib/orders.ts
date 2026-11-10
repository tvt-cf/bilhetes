import "server-only";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { markPaid } from "./community";
import { getDb, schema } from "./db";
import type { OrderStatus } from "./db/schema";
import { checkPayment, handleFromCheckoutUrl } from "./infinitepay";
import { produto } from "./site";

const { orders, people } = schema;

export async function createOrder(input: { personId: number; paymentPreference: "a_vista" | "parcelado"; amount?: number }) {
  const db = await getDb();
  const [row] = await db
    .insert(orders)
    .values({ ...input, amount: input.amount ?? produto.precoCentavos.parcelado }) // o link cobra o preço do cartão; Pix tem desconto
    .returning({ id: orders.id, amount: orders.amount });
  return row;
}

export async function setCheckoutUrl(orderId: number, checkoutUrl: string) {
  const db = await getDb();
  await db.update(orders).set({ checkoutUrl }).where(eq(orders.id, orderId));
}

// Confere o pagamento na InfinitePay e grava o que ela confirmou. Chamado pelo webhook e pela
// conferência do /admin. Devolve null quando o pedido não existe.
export async function reconcileOrder(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
  receiptUrl?: string;
}): Promise<OrderStatus | "nao_pago" | null> {
  // "pedido-12". Links da primeira versão usavam o id da pessoa como order_nsu: esses são ignorados
  // aqui (dariam no pedido errado) e precisam ser marcados no /admin.
  const id = /^pedido-(\d+)$/.exec(input.orderNsu)?.[1];
  if (!id) return null;
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id)));
  if (!order) return null;

  const check = await checkPayment({ ...input, handle: handleFromCheckoutUrl(order.checkoutUrl) });
  // webhook de algo que a InfinitePay não confirma: não muda nada
  if (!check.paid && order.status === "aguardando") return "nao_pago";

  // valor diferente do cobrado, ou pagamento que a InfinitePay deixou de confirmar (ex.: estorno)
  // ponytail: a doc não diz se `amount` vem com o desconto do Pix; aceita o preço cheio ou o do Pix
  const expected = [order.amount, check.captureMethod === "pix" ? produto.precoCentavos.a_vista : null];
  const status: OrderStatus = check.paid && expected.includes(check.amount ?? -1) ? "pago" : "divergente";
  const now = new Date();
  await db
    .update(orders)
    .set({
      status,
      paidAmount: check.paidAmount ?? order.paidAmount,
      installments: check.installments ?? order.installments,
      captureMethod: check.captureMethod ?? order.captureMethod,
      transactionNsu: input.transactionNsu,
      invoiceSlug: input.slug,
      receiptUrl: input.receiptUrl ?? order.receiptUrl,
      paidAt: order.paidAt ?? now,
      checkedAt: now,
    })
    .where(eq(orders.id, order.id));
  if (status === "pago") await markPaid(order.personId);
  return status;
}

// Reconfere na InfinitePay todos os pedidos que já tiveram pagamento avisado (ou só um).
// ponytail: um pedido por vez; com 300 caixas é rápido o bastante.
export async function recheckOrders(orderId?: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(orderId ? eq(orders.id, orderId) : isNotNull(orders.transactionNsu));
  for (const o of rows) {
    if (!o.transactionNsu || !o.invoiceSlug) continue;
    await reconcileOrder({ orderNsu: `pedido-${o.id}`, transactionNsu: o.transactionNsu, slug: o.invoiceSlug });
  }
  return rows.length;
}

export async function listOrders(limit = 200) {
  const db = await getDb();
  return db
    .select({
      id: orders.id,
      personId: orders.personId,
      name: people.name,
      phone: people.phone,
      orderNumber: people.orderNumber,
      paymentPreference: orders.paymentPreference,
      amount: orders.amount,
      status: orders.status,
      paidAmount: orders.paidAmount,
      installments: orders.installments,
      captureMethod: orders.captureMethod,
      transactionNsu: orders.transactionNsu,
      receiptUrl: orders.receiptUrl,
      checkoutUrl: orders.checkoutUrl,
      paidAt: orders.paidAt,
      checkedAt: orders.checkedAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(people, eq(people.id, orders.personId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getOrderTotals() {
  const db = await getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      paid: sql<number>`count(*) filter (where ${orders.status} = 'pago')`,
      waiting: sql<number>`count(*) filter (where ${orders.status} = 'aguardando')`,
      divergent: sql<number>`count(*) filter (where ${orders.status} = 'divergente')`,
      expected: sql<number>`coalesce(sum(case when ${orders.captureMethod} = 'pix' then ${produto.precoCentavos.a_vista} else ${orders.amount} end) filter (where ${orders.status} = 'pago'), 0)`,
      received: sql<number>`coalesce(sum(${orders.paidAmount}) filter (where ${orders.status} = 'pago'), 0)`,
      pix: sql<number>`count(*) filter (where ${orders.status} = 'pago' and ${orders.captureMethod} = 'pix')`,
      card: sql<number>`count(*) filter (where ${orders.status} = 'pago' and ${orders.captureMethod} = 'credit_card')`,
    })
    .from(orders);
  const n = (v: unknown) => Number(v ?? 0);
  return {
    total: n(row?.total),
    paid: n(row?.paid),
    waiting: n(row?.waiting),
    divergent: n(row?.divergent),
    expected: n(row?.expected),
    received: n(row?.received),
    pix: n(row?.pix),
    card: n(row?.card),
  };
}

// Página de obrigada: a InfinitePay manda a pessoa de volta com os dados da transação. A página é pública,
// então só confere pedidos que ainda estão aguardando (um link forjado não mexe em pedido já pago ou divergente).
export async function confirmOrderOnReturn(input: {
  orderNsu: string;
  transactionNsu?: string;
  slug?: string;
  receiptUrl?: string;
}) {
  const id = /^pedido-(\d+)$/.exec(input.orderNsu)?.[1];
  if (!id) return null;
  const db = await getDb();
  const load = async () => (await db.select().from(orders).where(eq(orders.id, Number(id))))[0];
  let order = await load();
  if (!order) return null;
  if (order.status === "aguardando" && input.transactionNsu && input.slug) {
    const status = await reconcileOrder({ ...input, transactionNsu: input.transactionNsu, slug: input.slug }).catch((e) => {
      console.error(e);
      return null;
    });
    if (status === "pago") order = (await load()) ?? order;
  }
  return {
    id: order.id,
    status: order.status,
    paymentPreference: order.paymentPreference,
    amount: order.amount,
    paidAmount: order.paidAmount,
    installments: order.installments,
    captureMethod: order.captureMethod,
    receiptUrl: order.receiptUrl,
  };
}
