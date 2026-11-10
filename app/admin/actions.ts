"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { endSession, normalizeEmail, requestLogin, requireAdmin, verifyCode, verifyToken } from "@/lib/auth";
import { cancelCampaign, createCampaign, dispatchCampaign, personalize } from "@/lib/campaigns";
import { markPurchased } from "@/lib/community";
import { type BoxColor, type CampaignKind, deliveryStatuses, type Segment } from "@/lib/db/schema";
import { type DeliveryPatch, getOrderTimeline, recheckOrders, setOrdersArchived, updateDelivery } from "@/lib/orders";
import { normalizePhone } from "@/lib/phone";
import { STOCK_TAG, addStockLot, correctStockLot, setManualSoldOut } from "@/lib/stock";
import { sendTemplate } from "@/lib/whatsapp";

export type ActionState = { ok: boolean; message: string } | null;

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string }
  | null;

// Passo 1: e-mail. A resposta é a mesma esteja o e-mail na lista ou não.
export async function requestCodeAction(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { step: "email", error: "Confira o e-mail." };
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  try {
    await requestLogin(email, origin);
  } catch (e) {
    console.error(e);
    return { step: "email", error: "Não conseguimos mandar o e-mail agora. Tente de novo em instantes." };
  }
  return { step: "code", email: normalizeEmail(email) };
}

// Passo 2: código de 6 dígitos que chegou no e-mail.
export async function verifyCodeAction(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  if (await verifyCode(email, String(form.get("code") ?? ""))) redirect("/admin");
  return { step: "code", email, error: "Código incorreto ou vencido. Confira o e-mail mais recente." };
}

// Uma ação para os dois passos do login, decidida pelo botão apertado.
export async function loginStepAction(prev: LoginState, form: FormData): Promise<LoginState> {
  const intent = form.get("intent");
  if (intent === "voltar") return { step: "email" };
  if (intent === "codigo") return verifyCodeAction(prev, form);
  return requestCodeAction(prev, form);
}

// Link mágico: a página /admin/entrar pede um clique antes de usar o token, para leitores de link
// dos provedores de e-mail não gastarem o acesso sozinhos.
export async function confirmLinkAction(form: FormData) {
  if (await verifyToken(String(form.get("token") ?? ""))) redirect("/admin");
  redirect("/admin/login?link=invalido");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

export async function markPurchasedAction(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("personId"));
  const order = String(form.get("orderNumber") ?? "").trim();
  if (!id || !order) return;
  await markPurchased(id, order.startsWith("Nº") ? order : `Nº ${order.padStart(4, "0")}`);
  updateTag(STOCK_TAG);
  revalidatePath("/admin");
}

// Conferência com a InfinitePay: um pedido (orderId) ou todos que já tiveram pagamento avisado.
export async function recheckOrdersAction(form: FormData) {
  const admin = await requireAdmin();
  const id = Number(form.get("orderId")) || undefined;
  await recheckOrders(id, admin.email);
  updateTag(STOCK_TAG);
  revalidatePath("/admin", "layout");
}

export async function archiveOrdersAction(ids: number[], archived: boolean) {
  const admin = await requireAdmin();
  const valid = ids.filter((id) => Number.isInteger(id) && id > 0);
  await setOrdersArchived(valid, archived, admin.email);
  updateTag(STOCK_TAG); // pedido pago arquivado devolve a caixa ao estoque
  revalidatePath("/admin", "layout");
}

export async function updateDeliveryAction(ids: number[], patch: DeliveryPatch) {
  const admin = await requireAdmin();
  const valid = ids.filter((id) => Number.isInteger(id) && id > 0);
  const status = deliveryStatuses.find((s) => s === patch.status); // só etapas conhecidas
  const text = (v: unknown) => (typeof v === "string" ? v : v === null ? null : undefined);
  await updateDelivery(
    valid,
    { status, carrier: text(patch.carrier), owner: text(patch.owner), complaint: text(patch.complaint) },
    admin.email,
  );
  revalidatePath("/admin", "layout");
}

// Entrada de estoque por cor: lote recebido (positivo) ou correção (negativo).
export async function addStockLotAction(form: FormData) {
  const admin = await requireAdmin();
  const boxColor: BoxColor = form.get("boxColor") === "escura" ? "escura" : "clara";
  const quantity = Math.trunc(Number(form.get("quantity")));
  if (!(quantity > 0 && quantity <= 10000)) return; // lote é sempre entrada; para tirar, corrija um lote
  const note = String(form.get("note") ?? "").trim().slice(0, 200) || null;
  await addStockLot({ boxColor, quantity, note, actor: admin.email });
  updateTag(STOCK_TAG); // o site passa a mostrar a cor disponível (ou esgotada)
  revalidatePath("/admin", "layout");
}

export async function orderTimelineAction(orderId: number) {
  await requireAdmin();
  return Number.isInteger(orderId) && orderId > 0 ? getOrderTimeline(orderId) : [];
}

export type CorrectState = { ok: boolean; message: string } | null;

// Correção de um lote com motivo obrigatório; fica no histórico ligada ao lote original.
export async function correctStockLotAction(_: CorrectState, form: FormData): Promise<CorrectState> {
  const admin = await requireAdmin();
  const lotId = Number(form.get("lotId"));
  const raw = String(form.get("quantity") ?? "").trim();
  const quantity = Number(raw);
  const reason = String(form.get("reason") ?? "").trim().slice(0, 200);
  if (!raw || !Number.isInteger(quantity)) return { ok: false, message: "Informe a quantidade certa do lote." };
  if (!reason) return { ok: false, message: "Conte o motivo da correção." };
  const r = await correctStockLot({ lotId, quantity, reason, actor: admin.email });
  if (!r.ok) return r;
  updateTag(STOCK_TAG);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Correção registrada." };
}

export async function setSoldOutAction(form: FormData) {
  await requireAdmin();
  await setManualSoldOut(form.get("soldOut") === "1");
  updateTag(STOCK_TAG); // o site público passa a mostrar a fila de espera (ou volta a vender)
  revalidatePath("/admin", "layout");
}

const KINDS: CampaignKind[] = ["sabedoria", "evento", "pedido", "lote"];
const SEGMENTS: Segment[] = ["comunidade", "fila_espera", "pre_venda", "comprou"];

export async function createCampaignAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const kind = String(form.get("kind")) as CampaignKind;
  const segments = form.getAll("segments").map(String).filter((s): s is Segment => SEGMENTS.includes(s as Segment));
  const when = String(form.get("when"));
  const scheduledIso = String(form.get("scheduledAt") ?? "");

  if (!title) return { ok: false, message: "Dê um nome à mensagem (aparece só no histórico)." };
  if (!body) return { ok: false, message: "Escreva a mensagem." };
  if (!KINDS.includes(kind)) return { ok: false, message: "Escolha o tipo de mensagem." };
  if (!segments.length) return { ok: false, message: "Escolha pelo menos um público." };

  const scheduledAt = when === "agendar" ? new Date(scheduledIso) : new Date();
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, message: "Escolha a data e a hora da mensagem." };
  if (when === "agendar" && scheduledAt.getTime() < Date.now()) {
    return { ok: false, message: "O horário agendado já passou." };
  }

  const id = await createCampaign({ title, kind, segments, body, scheduledAt, createdBy: admin.email });
  if (when !== "agendar") after(() => dispatchCampaign(id));
  revalidatePath("/admin/mensagens");
  return {
    ok: true,
    message: when === "agendar" ? "Mensagem agendada." : "Mensagem saindo. O histórico atualiza conforme as entregas.",
  };
}

export async function sendTestAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const phone = normalizePhone(process.env.ADMIN_TEST_PHONE ?? "");
  if (!phone) return { ok: false, message: "Configure ADMIN_TEST_PHONE para receber testes." };
  const kind = String(form.get("kind")) as CampaignKind;
  const result = await sendTemplate(kind, phone, personalize(String(form.get("body") ?? ""), "Gabriela"));
  if (!result.ok) return { ok: false, message: `A Meta recusou: ${result.error}` };
  return { ok: true, message: result.simulated ? "Teste simulado (WhatsApp não configurado)." : "Teste enviado." };
}

export async function cancelCampaignAction(form: FormData) {
  await requireAdmin();
  await cancelCampaign(Number(form.get("campaignId")));
  revalidatePath("/admin/mensagens");
}
