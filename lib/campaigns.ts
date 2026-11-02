import "server-only";
import { and, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { CampaignKind, MessageStatus, Segment } from "./db/schema";
import { sendTemplate } from "./whatsapp";

const { people, campaigns, messages } = schema;

export function personalize(body: string, name: string | null) {
  const first = name?.trim().split(/\s+/)[0] ?? "";
  return body.replace(/\{\{\s*nome\s*\}\}/gi, first).replace(/\s+([,.!?])/g, "$1");
}

// Quem recebe: segmentos escolhidos, sem descadastrados, respeitando o que cada pessoa aceitou receber.
function audienceWhere(kind: CampaignKind, segments: Segment[]) {
  const filters = [isNull(people.optedOutAt), inArray(people.status, segments)];
  if (kind === "sabedoria") filters.push(eq(people.wantsWisdom, true));
  if (kind === "evento") filters.push(eq(people.wantsEvents, true));
  // "lote" vai para quem pediu o aviso na fila de espera, então não depende das outras preferências
  return and(...filters);
}

export async function countAudience(kind: CampaignKind, segments: Segment[]) {
  if (!segments.length) return 0;
  const db = await getDb();
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(people).where(audienceWhere(kind, segments));
  return Number(row?.n ?? 0);
}

export async function createCampaign(input: {
  title: string;
  kind: CampaignKind;
  segments: Segment[];
  body: string;
  scheduledAt: Date;
  createdBy: string;
}) {
  const db = await getDb();
  const [row] = await db.insert(campaigns).values({ ...input, status: "agendado" }).returning({ id: campaigns.id });
  return row.id;
}

export async function dispatchCampaign(campaignId: number) {
  const db = await getDb();
  // trava simples: só quem mudar de "agendado" para "enviando" segue com o envio
  const [campaign] = await db
    .update(campaigns)
    .set({ status: "enviando", startedAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.status, "agendado")))
    .returning();
  if (!campaign) return;

  const recipients = await db
    .select({ id: people.id, name: people.name, phone: people.phone })
    .from(people)
    .where(audienceWhere(campaign.kind, campaign.segments));

  let failures = 0;
  const BATCH = 20;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((p) => sendTemplate(campaign.kind, p.phone, personalize(campaign.body, p.name))),
    );
    const rows = results.map((r, j) => {
      if (!r.ok) failures++;
      return {
        campaignId,
        personId: batch[j].id,
        waMessageId: r.ok ? r.waMessageId : null,
        status: (r.ok ? (r.simulated ? "simulado" : "enviado") : "falhou") as MessageStatus,
        error: r.ok ? null : r.error,
      };
    });
    if (rows.length) await db.insert(messages).values(rows);
  }

  const allFailed = recipients.length > 0 && failures === recipients.length;
  await db
    .update(campaigns)
    .set({ status: allFailed ? "falhou" : "concluido", finishedAt: new Date() })
    .where(eq(campaigns.id, campaignId));
}

export async function dispatchDue() {
  const db = await getDb();
  const due = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.status, "agendado"), lte(campaigns.scheduledAt, new Date())));
  for (const c of due) await dispatchCampaign(c.id);
  return due.length;
}

export async function cancelCampaign(campaignId: number) {
  const db = await getDb();
  await db.delete(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.status, "agendado")));
}

export async function listCampaigns(limit = 30) {
  const db = await getDb();
  const stats = db
    .select({
      campaignId: messages.campaignId,
      total: sql<number>`count(*)`.as("total"),
      delivered: sql<number>`count(*) filter (where ${messages.status} in ('entregue','lido'))`.as("delivered"),
      read: sql<number>`count(*) filter (where ${messages.status} = 'lido')`.as("read"),
      failed: sql<number>`count(*) filter (where ${messages.status} = 'falhou')`.as("failed"),
      simulated: sql<number>`count(*) filter (where ${messages.status} = 'simulado')`.as("simulated"),
      replies: sql<number>`count(*) filter (where ${messages.repliedAt} is not null)`.as("replies"),
    })
    .from(messages)
    .groupBy(messages.campaignId)
    .as("stats");

  const rows = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      kind: campaigns.kind,
      segments: campaigns.segments,
      status: campaigns.status,
      scheduledAt: campaigns.scheduledAt,
      createdBy: campaigns.createdBy,
      total: stats.total,
      delivered: stats.delivered,
      read: stats.read,
      failed: stats.failed,
      simulated: stats.simulated,
      replies: stats.replies,
    })
    .from(campaigns)
    .leftJoin(stats, eq(stats.campaignId, campaigns.id))
    .orderBy(desc(campaigns.scheduledAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    total: Number(r.total ?? 0),
    delivered: Number(r.delivered ?? 0),
    read: Number(r.read ?? 0),
    failed: Number(r.failed ?? 0),
    simulated: Number(r.simulated ?? 0),
    replies: Number(r.replies ?? 0),
  }));
}

const rank: Record<MessageStatus, number> = { simulado: 0, enviado: 1, entregue: 2, lido: 3, falhou: 4 };

// Webhooks da Meta podem chegar fora de ordem: nunca rebaixa um status (ex.: lido -> entregue).
export async function updateMessageStatus(waMessageId: string, status: MessageStatus, error?: string) {
  const db = await getDb();
  const [msg] = await db.select().from(messages).where(eq(messages.waMessageId, waMessageId));
  if (!msg) return;
  const canFail = status === "falhou" && msg.status === "enviado";
  if (!canFail && rank[status] <= rank[msg.status]) return;
  await db
    .update(messages)
    .set({ status, error: error ?? null, updatedAt: new Date() })
    .where(eq(messages.id, msg.id));
}

// Marca a resposta na mensagem mais recente enviada para esse telefone.
export async function recordReply(phone: string) {
  const db = await getDb();
  const [person] = await db.select({ id: people.id }).from(people).where(eq(people.phone, phone));
  if (!person) return;
  const [msg] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.personId, person.id), isNull(messages.repliedAt)))
    .orderBy(desc(messages.updatedAt))
    .limit(1);
  if (msg) await db.update(messages).set({ repliedAt: new Date() }).where(eq(messages.id, msg.id));
}
