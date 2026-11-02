"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { cancelCampaign, createCampaign, dispatchCampaign, personalize } from "@/lib/campaigns";
import { markPurchased } from "@/lib/community";
import type { CampaignKind, Segment } from "@/lib/db/schema";
import { recheckOrders } from "@/lib/orders";
import { normalizePhone } from "@/lib/phone";
import { STOCK_TAG, setManualSoldOut } from "@/lib/stock";
import { sendTemplate } from "@/lib/whatsapp";

export type ActionState = { ok: boolean; message: string } | null;

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!checkPassword(String(form.get("password") ?? ""))) return { ok: false, message: "Senha incorreta." };
  await startSession();
  redirect("/admin");
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
  await requireAdmin();
  const id = Number(form.get("orderId")) || undefined;
  await recheckOrders(id);
  updateTag(STOCK_TAG);
  revalidatePath("/admin/pedidos");
}

export async function setSoldOutAction(form: FormData) {
  await requireAdmin();
  await setManualSoldOut(form.get("soldOut") === "1");
  updateTag(STOCK_TAG); // o site público passa a mostrar a fila de espera (ou volta a vender)
  revalidatePath("/admin");
}

const KINDS: CampaignKind[] = ["sabedoria", "evento", "pedido", "lote"];
const SEGMENTS: Segment[] = ["comunidade", "fila_espera", "pre_venda", "comprou"];

export async function createCampaignAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const kind = String(form.get("kind")) as CampaignKind;
  const segments = form.getAll("segments").map(String).filter((s): s is Segment => SEGMENTS.includes(s as Segment));
  const when = String(form.get("when"));
  const scheduledIso = String(form.get("scheduledAt") ?? "");

  if (!title) return { ok: false, message: "Dê um nome ao envio (aparece só no histórico)." };
  if (!body) return { ok: false, message: "Escreva a mensagem." };
  if (!KINDS.includes(kind)) return { ok: false, message: "Escolha o tipo de mensagem." };
  if (!segments.length) return { ok: false, message: "Escolha pelo menos um público." };

  const scheduledAt = when === "agendar" ? new Date(scheduledIso) : new Date();
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, message: "Escolha data e hora do envio." };
  if (when === "agendar" && scheduledAt.getTime() < Date.now()) {
    return { ok: false, message: "O horário agendado já passou." };
  }

  const id = await createCampaign({ title, kind, segments, body, scheduledAt });
  if (when !== "agendar") after(() => dispatchCampaign(id));
  revalidatePath("/admin/envios");
  return {
    ok: true,
    message: when === "agendar" ? "Envio agendado." : "Envio iniciado. O histórico atualiza conforme as entregas.",
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
  revalidatePath("/admin/envios");
}
