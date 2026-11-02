import "server-only";
import { eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "./db";
import { produto } from "./site";

const { people, settings } = schema;

export const STOCK_TAG = "estoque";

// Esgota quando as vendas chegam à tiragem ou quando alguém marca "esgotado" no /admin.
export async function getStockLive() {
  const db = await getDb();
  const [[flag], [row]] = await Promise.all([
    db.select({ value: settings.value }).from(settings).where(eq(settings.key, "esgotado")),
    db.select({ buyers: sql<number>`count(*) filter (where ${people.status} = 'comprou')` }).from(people),
  ]);
  const manual = flag?.value === true;
  const buyers = Number(row?.buyers ?? 0);
  return { soldOut: manual || buyers >= produto.tiragem, manual, buyers };
}

// Versão em cache para o site público, que continua estático. Invalidada pela tag ao vender ou ao mudar no admin.
export async function getStock(): Promise<{ soldOut: boolean }> {
  "use cache";
  cacheTag(STOCK_TAG);
  cacheLife("max");
  try {
    const { soldOut } = await getStockLive();
    return { soldOut };
  } catch {
    // sem banco no build, o site sai como disponível; a compra confere o estoque de verdade
    return { soldOut: false };
  }
}

export async function setManualSoldOut(soldOut: boolean) {
  const db = await getDb();
  await db
    .insert(settings)
    .values({ key: "esgotado", value: soldOut })
    .onConflictDoUpdate({ target: settings.key, set: { value: soldOut } });
}
