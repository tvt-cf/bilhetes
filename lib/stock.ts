import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "./db";
import type { BoxColor } from "./db/schema";
import { produto } from "./site";

const { orders, people, settings, stockLots } = schema;

export const STOCK_TAG = "estoque";
export const boxColors: BoxColor[] = ["clara", "escura"];

export type ColorStock = {
  total: number; // soma dos lotes recebidos (e correções)
  reserved: number; // pedidos pagos ainda não entregues
  delivered: number; // pedidos pagos já entregues
  available: number; // total − reservados − entregues
};

// Estoque por cor. Cada pedido pago (não arquivado) desconta uma caixa da cor escolhida, entregue ou não.
// Enquanto nenhum lote foi registrado no /admin/estoque, vale a regra antiga: esgota ao vender a tiragem.
// Esgota de vez quando as duas cores acabam ou quando alguém marca "esgotado" no /admin.
export async function getStockLive() {
  const db = await getDb();
  const [[flag], lots, sold, [buyersRow]] = await Promise.all([
    db.select({ value: settings.value }).from(settings).where(eq(settings.key, "esgotado")),
    db
      .select({ color: stockLots.boxColor, total: sql<number>`sum(${stockLots.quantity})` })
      .from(stockLots)
      .groupBy(stockLots.boxColor),
    db
      .select({
        color: orders.boxColor,
        reserved: sql<number>`count(*) filter (where ${orders.deliveredAt} is null)`,
        delivered: sql<number>`count(*) filter (where ${orders.deliveredAt} is not null)`,
      })
      .from(orders)
      .where(sql`${orders.status} = 'pago' and ${orders.archivedAt} is null`)
      .groupBy(orders.boxColor),
    db.select({ buyers: sql<number>`count(*) filter (where ${people.status} = 'comprou')` }).from(people),
  ]);
  const manual = flag?.value === true;
  const buyers = Number(buyersRow?.buyers ?? 0);
  const configured = lots.length > 0;
  const colors = Object.fromEntries(
    boxColors.map((c) => {
      const total = Number(lots.find((l) => l.color === c)?.total ?? 0);
      const s = sold.find((r) => r.color === c);
      const reserved = Number(s?.reserved ?? 0);
      const delivered = Number(s?.delivered ?? 0);
      return [c, { total, reserved, delivered, available: Math.max(total - reserved - delivered, 0) }];
    }),
  ) as Record<BoxColor, ColorStock>;
  const colorSoldOut = Object.fromEntries(
    boxColors.map((c) => [c, configured && colors[c].available <= 0]),
  ) as Record<BoxColor, boolean>;
  const allGone = configured ? boxColors.every((c) => colorSoldOut[c]) : buyers >= produto.tiragem;
  return { soldOut: manual || allGone, manual, buyers, configured, colors, colorSoldOut };
}

// Versão em cache para o site público, que continua estático. Invalidada pela tag ao vender ou ao mudar no admin.
export async function getStock(): Promise<{ soldOut: boolean; colorSoldOut: Record<BoxColor, boolean> }> {
  "use cache";
  cacheTag(STOCK_TAG);
  cacheLife("max");
  try {
    const { soldOut, colorSoldOut } = await getStockLive();
    return { soldOut, colorSoldOut };
  } catch {
    // sem banco no build, o site sai como disponível; a compra confere o estoque de verdade
    return { soldOut: false, colorSoldOut: { clara: false, escura: false } };
  }
}

export async function setManualSoldOut(soldOut: boolean) {
  const db = await getDb();
  await db
    .insert(settings)
    .values({ key: "esgotado", value: soldOut })
    .onConflictDoUpdate({ target: settings.key, set: { value: soldOut } });
}

export async function addStockLot(input: { boxColor: BoxColor; quantity: number; note: string | null; actor: string }) {
  const db = await getDb();
  await db.insert(stockLots).values(input);
}

export async function listStockLots(limit = 50) {
  const db = await getDb();
  return db.select().from(stockLots).orderBy(desc(stockLots.createdAt)).limit(limit);
}

// Fila de espera para orientar a próxima produção: por cor (quem estava fora da área já escolheu a cor;
// quem chegou com o site esgotado ainda não) e as cidades de fora da Grande São Paulo que mais pedem.
export async function getWaitlistDemand() {
  const db = await getDb();
  const color = sql<string | null>`${people.outsideArea}->>'boxColor'`;
  const city = sql<string>`(${people.outsideArea}->>'city') || '/' || (${people.outsideArea}->>'uf')`;
  const waiting = sql`${people.status} = 'fila_espera' and ${people.optedOutAt} is null`;
  const [byColor, byCity] = await Promise.all([
    db.select({ color, n: sql<number>`count(*)` }).from(people).where(waiting).groupBy(color),
    db
      .select({ city, n: sql<number>`count(*)` })
      .from(people)
      .where(sql`${waiting} and ${people.outsideArea} is not null`)
      .groupBy(city)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
  ]);
  const n = (c: string) => Number(byColor.find((r) => r.color === c)?.n ?? 0);
  return {
    clara: n("clara"),
    escura: n("escura"),
    semCor: byColor.filter((r) => r.color !== "clara" && r.color !== "escura").reduce((a, r) => a + Number(r.n), 0),
    cities: byCity.map((r) => ({ city: r.city, n: Number(r.n) })),
  };
}
