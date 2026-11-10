import "server-only";
import { and, count, desc, eq, ilike, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { OutsideArea, PersonStatus } from "./db/schema";
import { produto } from "./site";

const { people, messages, campaigns, orders } = schema;

export type SegmentFilter = "todos" | PersonStatus | "descadastrados";

export async function subscribe(input: {
  name: string | null;
  phone: string;
  wantsEvents: boolean;
  wantsWisdom: boolean;
  source: string;
}) {
  const db = await getDb();
  await db
    .insert(people)
    .values({ ...input, status: "comunidade" })
    .onConflictDoUpdate({
      target: people.phone,
      set: {
        name: sql`coalesce(excluded.name, ${people.name})`,
        wantsEvents: input.wantsEvents,
        wantsWisdom: input.wantsWisdom,
        optedOutAt: null,
      },
    });
}

// paymentPreference fica vazia quando a pessoa só deixou o contato e ainda não escolheu como pagar
export async function joinPresale(input: { name: string; phone: string; paymentPreference?: string }) {
  const db = await getDb();
  const now = new Date();
  const [row] = await db
    .insert(people)
    .values({ ...input, source: "pre-venda", status: "pre_venda", presaleAt: now })
    .onConflictDoUpdate({
      target: people.phone,
      set: {
        name: input.name,
        paymentPreference: input.paymentPreference ?? sql`${people.paymentPreference}`,
        presaleAt: sql`coalesce(${people.presaleAt}, ${now.toISOString()}::timestamptz)`,
        // quem já comprou continua como comprou
        status: sql`case when ${people.status} = 'comprou' then 'comprou' else 'pre_venda' end`,
        optedOutAt: null,
      },
    })
    .returning({ id: people.id });
  return row.id;
}

// Esgotado: entra na fila de espera do próximo lote. Quem já reservou ou comprou mantém o status.
export async function joinWaitlist(input: { name: string; phone: string }) {
  const db = await getDb();
  const now = new Date();
  await db
    .insert(people)
    .values({ ...input, source: "fila de espera", status: "fila_espera", waitlistAt: now })
    .onConflictDoUpdate({
      target: people.phone,
      set: {
        name: input.name,
        waitlistAt: sql`coalesce(${people.waitlistAt}, ${now.toISOString()}::timestamptz)`,
        status: sql`case when ${people.status} in ('pre_venda', 'comprou') then ${people.status} else 'fila_espera' end`,
        optedOutAt: null,
      },
    });
}

// CEP fora da Grande São Paulo: vai para a fila de espera com o pedido guardado (cor, CEP e cidade).
export async function joinOutsideArea(input: { name: string; phone: string } & OutsideArea) {
  const { name, phone, ...outsideArea } = input;
  const db = await getDb();
  const now = new Date();
  await db
    .insert(people)
    .values({ name, phone, source: "fora da área", status: "fila_espera", waitlistAt: now, outsideArea, outsideAreaAt: now })
    .onConflictDoUpdate({
      target: people.phone,
      set: {
        name,
        outsideArea,
        outsideAreaAt: now,
        waitlistAt: sql`coalesce(${people.waitlistAt}, ${now.toISOString()}::timestamptz)`,
        status: sql`case when ${people.status} = 'comprou' then 'comprou' else 'fila_espera' end`,
        optedOutAt: null,
      },
    });
}

// Pagamento confirmado pela InfinitePay. O Nº da edição continua sendo dado no /admin.
export async function markPaid(personId: number) {
  const db = await getDb();
  await db
    .update(people)
    .set({ status: "comprou", purchasedAt: new Date() })
    .where(and(eq(people.id, personId), ne(people.status, "comprou")));
}

// "Comprou" segue os pedidos: com pedido pago (e não arquivado) a pessoa é compradora. Sem nenhum, volta
// para o passo mais recente que deu no site (fila de espera, inclusive fora da área, ou pré-venda).
// Quem foi marcada à mão como compradora (com Nº do pedido no /admin) continua como está.
export async function refreshBuyerStatus(personIds: number[]) {
  const ids = [...new Set(personIds)].filter(Boolean);
  if (!ids.length) return;
  const db = await getDb();
  const paid = sql`exists (select 1 from orders o where o.person_id = ${people.id} and o.status = 'pago' and o.archived_at is null)`;
  const inList = sql`${people.id} in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`;
  await db
    .update(people)
    .set({ status: "comprou", purchasedAt: sql`coalesce(${people.purchasedAt}, now())` })
    .where(and(inList, paid, ne(people.status, "comprou")));
  await db
    .update(people)
    .set({
      status: sql`case
        when greatest(${people.waitlistAt}, ${people.outsideAreaAt}) > coalesce(${people.presaleAt}, '-infinity') then 'fila_espera'
        when ${people.presaleAt} is not null then 'pre_venda'
        when ${people.waitlistAt} is not null then 'fila_espera'
        else 'comunidade' end`,
      purchasedAt: null,
    })
    .where(and(inList, sql`not ${paid}`, eq(people.status, "comprou"), isNull(people.orderNumber)));
}

export async function markPurchased(personId: number, orderNumber: string) {
  const db = await getDb();
  await db
    .update(people)
    .set({ status: "comprou", orderNumber, purchasedAt: new Date() })
    .where(eq(people.id, personId));
}

export async function optOutByPhone(phone: string) {
  const db = await getDb();
  await db.update(people).set({ optedOutAt: new Date() }).where(eq(people.phone, phone));
}

export async function getStats() {
  const db = await getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*) filter (where ${people.optedOutAt} is null)`,
      lastWeek: sql<number>`count(*) filter (where ${people.createdAt} > now() - interval '7 days')`,
      presale: sql<number>`count(*) filter (where ${people.status} = 'pre_venda' and ${people.optedOutAt} is null)`,
      waitlist: sql<number>`count(*) filter (where ${people.status} = 'fila_espera' and ${people.optedOutAt} is null)`,
      buyers: sql<number>`count(*) filter (where ${people.status} = 'comprou')`,
      wisdom: sql<number>`count(*) filter (where ${people.wantsWisdom} and ${people.optedOutAt} is null)`,
      optedOut: sql<number>`count(*) filter (where ${people.optedOutAt} is not null)`,
    })
    .from(people);
  const n = (v: unknown) => Number(v ?? 0);
  return {
    total: n(row?.total),
    lastWeek: n(row?.lastWeek),
    presale: n(row?.presale),
    waitlist: n(row?.waitlist),
    buyers: n(row?.buyers),
    wisdom: n(row?.wisdom),
    optedOut: n(row?.optedOut),
    edition: produto.tiragem,
  };
}

export async function getSegmentCounts() {
  const db = await getDb();
  const rows = await db
    .select({
      status: people.status,
      out: isNotNull(people.optedOutAt).as("out"),
      n: count(),
    })
    .from(people)
    .groupBy(people.status, sql`out`);
  const counts: Record<SegmentFilter, number> = {
    todos: 0,
    comunidade: 0,
    fila_espera: 0,
    pre_venda: 0,
    comprou: 0,
    descadastrados: 0,
  };
  for (const r of rows) {
    if (r.out) counts.descadastrados += r.n;
    else {
      counts[r.status] += r.n;
      counts.todos += r.n;
    }
  }
  return counts;
}

export async function listPeople(opts: { segment: SegmentFilter; q?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  const filters = [];
  if (opts.segment === "descadastrados") filters.push(isNotNull(people.optedOutAt));
  else {
    filters.push(isNull(people.optedOutAt));
    if (opts.segment !== "todos") filters.push(eq(people.status, opts.segment));
  }
  if (opts.q) {
    const like = `%${opts.q}%`;
    filters.push(or(ilike(people.name, like), ilike(people.phone, `%${opts.q.replace(/\D/g, "") || opts.q}%`)));
  }

  // último envio de cada pessoa
  const last = db
    .select({
      personId: messages.personId,
      status: messages.status,
      title: campaigns.title,
      rn: sql<number>`row_number() over (partition by ${messages.personId} order by ${messages.updatedAt} desc)`.as("rn"),
    })
    .from(messages)
    .innerJoin(campaigns, eq(campaigns.id, messages.campaignId))
    .as("last");

  // pedido de cada pessoa para a coluna "Pedido" (sem os arquivados)
  const lastOrder = db
    .select({
      personId: orders.personId,
      id: sql<number>`${orders.id}`.as("order_id"),
      status: sql<string>`${orders.status}`.as("order_status"),
      boxColor: sql<string | null>`${orders.boxColor}`.as("order_color"),
      amount: sql<number>`coalesce(${orders.paidAmount}, ${orders.amount})`.as("order_amount"),
      city: sql<string | null>`(${orders.address}->>'city') || '/' || (${orders.address}->>'state')`.as("order_city"),
      delivered: sql<boolean>`${orders.deliveredAt} is not null`.as("order_delivered"),
      // o pago vem antes; entre os demais, o mais recente
      rn: sql<number>`row_number() over (partition by ${orders.personId} order by (${orders.status} = 'pago') desc, ${orders.createdAt} desc)`.as(
        "order_rn",
      ),
    })
    .from(orders)
    .where(isNull(orders.archivedAt))
    .as("last_order");

  return db
    .select({
      id: people.id,
      name: people.name,
      phone: people.phone,
      status: people.status,
      source: people.source,
      wantsEvents: people.wantsEvents,
      wantsWisdom: people.wantsWisdom,
      paymentPreference: people.paymentPreference,
      orderNumber: people.orderNumber,
      outsideArea: people.outsideArea,
      optedOutAt: people.optedOutAt,
      createdAt: people.createdAt,
      lastTitle: last.title,
      lastStatus: last.status,
      order: {
        id: lastOrder.id,
        status: lastOrder.status,
        boxColor: lastOrder.boxColor,
        amount: lastOrder.amount,
        city: lastOrder.city,
        delivered: lastOrder.delivered,
      },
    })
    .from(people)
    .leftJoin(last, and(eq(last.personId, people.id), eq(last.rn, 1)))
    .leftJoin(lastOrder, and(eq(lastOrder.personId, people.id), eq(lastOrder.rn, 1)))
    .where(and(...filters))
    .orderBy(desc(people.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}
