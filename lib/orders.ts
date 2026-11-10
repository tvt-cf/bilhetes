import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { markPaid } from "./community";
import { getDb, schema } from "./db";
import type { BoxColor, DeliveryAddress, OrderEventKind, OrderEventVia, OrderStatus } from "./db/schema";
import { checkPayment, handleFromCheckoutUrl } from "./infinitepay";
import { produto } from "./site";

const { orders, orderEvents, people } = schema;

type EventInput = {
  kind: OrderEventKind;
  via: OrderEventVia;
  actor?: string | null;
  detail?: (typeof orderEvents.$inferInsert)["detail"];
};

// Registro no histórico do pedido. Falhar aqui não pode derrubar um pagamento: só loga.
async function logEvent(orderIds: number | number[], event: EventInput) {
  const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
  if (!ids.length) return;
  const db = await getDb();
  await db
    .insert(orderEvents)
    .values(ids.map((orderId) => ({ orderId, ...event, actor: event.actor ?? null })))
    .catch((e) => console.error("order_events", e));
}

export async function createOrder(input: {
  personId: number;
  paymentPreference: "a_vista" | "parcelado";
  boxColor: BoxColor;
  address: DeliveryAddress;
  amount?: number;
}) {
  const db = await getDb();
  const [row] = await db
    .insert(orders)
    .values({ ...input, amount: input.amount ?? produto.precoCentavos.parcelado }) // o link cobra o preço do cartão; Pix tem desconto
    .returning({ id: orders.id, amount: orders.amount });
  await logEvent(row.id, { kind: "criado", via: "cliente" });
  return row;
}

export async function setCheckoutUrl(orderId: number, checkoutUrl: string) {
  const db = await getDb();
  await db.update(orders).set({ checkoutUrl }).where(eq(orders.id, orderId));
  await logEvent(orderId, { kind: "link", via: "cliente" });
}

// Confere o pagamento na InfinitePay e grava o que ela confirmou. Chamado pelo webhook e pela
// conferência do /admin. Devolve null quando o pedido não existe.
export async function reconcileOrder(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
  receiptUrl?: string;
  via: Exclude<OrderEventVia, "cliente">;
  actor?: string;
}): Promise<OrderStatus | "nao_pago" | null> {
  // "pedido-12". Links da primeira versão usavam o id da pessoa como order_nsu: esses são ignorados
  // aqui (dariam no pedido errado) e precisam ser marcados no /admin.
  const id = /^pedido-(\d+)$/.exec(input.orderNsu)?.[1];
  if (!id) return null;
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id)));
  if (!order) return null;

  const check = await checkPayment({ orderNsu: input.orderNsu, transactionNsu: input.transactionNsu, slug: input.slug, handle: handleFromCheckoutUrl(order.checkoutUrl) });
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
  const paidAmount = check.paidAmount ?? order.paidAmount;
  const method = check.captureMethod ?? order.captureMethod;
  await logEvent(order.id, {
    kind: status === order.status ? "conferido" : "status",
    via: input.via,
    actor: input.actor,
    detail: { from: order.status, to: status, paidAmount, method },
  });
  return status;
}

// Reconfere na InfinitePay todos os pedidos que já tiveram pagamento avisado (ou só um).
// ponytail: um pedido por vez; com 300 caixas é rápido o bastante.
export async function recheckOrders(orderId: number | undefined, actor: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(orderId ? eq(orders.id, orderId) : and(isNotNull(orders.transactionNsu), isNull(orders.archivedAt)));
  for (const o of rows) {
    if (!o.transactionNsu || !o.invoiceSlug) continue;
    await reconcileOrder({ orderNsu: `pedido-${o.id}`, transactionNsu: o.transactionNsu, slug: o.invoiceSlug, via: "admin", actor });
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
      boxColor: orders.boxColor,
      address: orders.address,
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
      archivedAt: orders.archivedAt,
    })
    .from(orders)
    .leftJoin(people, eq(people.id, orders.personId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

// Arquivar tira o pedido da lista e dos números do admin, sem apagar nada; desarquivar devolve.
export async function setOrdersArchived(ids: number[], archived: boolean, actor: string) {
  if (!ids.length) return;
  const db = await getDb();
  const changed = await db
    .update(orders)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(inArray(orders.id, ids), archived ? isNull(orders.archivedAt) : isNotNull(orders.archivedAt)))
    .returning({ id: orders.id });
  await logEvent(
    changed.map((r) => r.id),
    { kind: archived ? "arquivado" : "desarquivado", via: "admin", actor },
  );
}

export type TimelineEvent = {
  kind: OrderEventKind;
  via: OrderEventVia;
  actor: string | null;
  detail: (typeof orderEvents.$inferSelect)["detail"];
  at: Date;
  inferred?: boolean; // pedido anterior ao histórico: reconstruído pelas datas gravadas no pedido
};

// Linha do tempo de um pedido. Pedidos criados antes do histórico existir ganham os marcos que dá
// para deduzir das datas do próprio pedido (abertura, pagamento, arquivamento).
export async function getOrderTimeline(orderId: number): Promise<TimelineEvent[]> {
  const db = await getDb();
  const [[order], events] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, orderId)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, orderId)).orderBy(asc(orderEvents.createdAt), asc(orderEvents.id)),
  ]);
  if (!order) return [];
  const list: TimelineEvent[] = events.map((e) => ({ kind: e.kind, via: e.via, actor: e.actor, detail: e.detail, at: e.createdAt }));
  const has = (kind: OrderEventKind) => list.some((e) => e.kind === kind);
  if (!has("criado")) list.push({ kind: "criado", via: "cliente", actor: null, detail: null, at: order.createdAt, inferred: true });
  if (order.paidAt && !has("status"))
    list.push({
      kind: "status",
      via: "webhook",
      actor: null,
      detail: { from: "aguardando", to: order.status, paidAmount: order.paidAmount, method: order.captureMethod },
      at: order.paidAt,
      inferred: true,
    });
  if (order.archivedAt && !has("arquivado"))
    list.push({ kind: "arquivado", via: "admin", actor: null, detail: null, at: order.archivedAt, inferred: true });
  return list.sort((a, b) => a.at.getTime() - b.at.getTime());
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
    .from(orders)
    .where(isNull(orders.archivedAt)); // arquivados (pedidos de teste) não entram nos números
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
    const status = await reconcileOrder({ ...input, transactionNsu: input.transactionNsu, slug: input.slug, via: "retorno" }).catch((e) => {
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
