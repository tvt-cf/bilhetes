"use server";

import { redirect } from "next/navigation";
import { joinPresale, joinWaitlist, subscribe } from "@/lib/community";
import { createCheckoutLink, infinitepayConfigured } from "@/lib/infinitepay";
import { createOrder, setCheckoutUrl } from "@/lib/orders";
import { normalizePhone } from "@/lib/phone";
import { getStockLive } from "@/lib/stock";

export type FormState = { ok: boolean; message: string } | null;

export async function subscribeAction(_: FormState, form: FormData): Promise<FormState> {
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  if (!phone) return { ok: false, message: "Confira o número: DDD + celular, ex. (11) 98765-4321." };
  const wantsEvents = form.get("events") === "on";
  const wantsWisdom = form.get("wisdom") === "on";
  if (!wantsEvents && !wantsWisdom) return { ok: false, message: "Escolha pelo menos um tipo de mensagem." };
  await subscribe({
    name: String(form.get("name") ?? "").trim() || null,
    phone,
    wantsEvents,
    wantsWisdom,
    source: "landing",
  });
  return { ok: true, message: "Pronto. O próximo bilhete chega na hora exata." };
}

export async function presaleAction(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const paymentPreference = form.get("payment") === "parcelado" ? "parcelado" : "a_vista";
  if (!name) return { ok: false, message: "Como podemos te chamar?" };
  if (!phone) return { ok: false, message: "Confira o número: DDD + celular, ex. (11) 98765-4321." };
  // a página pode estar em cache: confere o estoque real antes de abrir o pagamento
  if ((await getStockLive()).soldOut) {
    await joinWaitlist({ name, phone });
    return { ok: false, message: "Esgotou agora há pouco. Você entrou na fila de espera e avisamos no WhatsApp quando o próximo lote chegar." };
  }
  const personId = await joinPresale({ name, phone, paymentPreference });

  // com a InfinitePay configurada, vai direto para o checkout; sem ela, segue a reserva pelo WhatsApp
  if (infinitepayConfigured()) {
    let url: string;
    try {
      const order = await createOrder({ personId, paymentPreference });
      url = await createCheckoutLink({ orderId: order.id, amount: order.amount, name, phone, paymentPreference });
      await setCheckoutUrl(order.id, url);
    } catch (e) {
      console.error(e);
      return { ok: true, message: "Sua caixa de Bilhetes está reservada. O pagamento não abriu agora, então vamos te chamar no WhatsApp para finalizar." };
    }
    redirect(url);
  }
  return { ok: true, message: "Sua caixa de Bilhetes está reservada. Vamos te chamar no WhatsApp para finalizar o pagamento." };
}

export async function waitlistAction(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  if (!name) return { ok: false, message: "Como podemos te chamar?" };
  if (!phone) return { ok: false, message: "Confira o número: DDD + celular, ex. (11) 98765-4321." };
  await joinWaitlist({ name, phone });
  return { ok: true, message: "Você está na fila. Avisamos no WhatsApp assim que o próximo lote estiver disponível." };
}
