import "server-only";
import { and, count, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { PersonStatus } from "./db/schema";
import { produto } from "./site";

const { people, messages, campaigns } = schema;

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

export async function joinPresale(input: { name: string; phone: string; paymentPreference: string }) {
  const db = await getDb();
  const now = new Date();
  await db
    .insert(people)
    .values({ ...input, source: "pre-venda", status: "pre_venda", presaleAt: now })
    .onConflictDoUpdate({
      target: people.phone,
      set: {
        name: input.name,
        paymentPreference: input.paymentPreference,
        presaleAt: sql`coalesce(${people.presaleAt}, ${now.toISOString()}::timestamptz)`,
        // quem já comprou continua como comprou
        status: sql`case when ${people.status} = 'comprou' then 'comprou' else 'pre_venda' end`,
        optedOutAt: null,
      },
    });
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
      optedOutAt: people.optedOutAt,
      createdAt: people.createdAt,
      lastTitle: last.title,
      lastStatus: last.status,
    })
    .from(people)
    .leftJoin(last, and(eq(last.personId, people.id), eq(last.rn, 1)))
    .where(and(...filters))
    .orderBy(desc(people.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}
