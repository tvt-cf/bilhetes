"use server";

import { joinPresale, subscribe } from "@/lib/community";
import { normalizePhone } from "@/lib/phone";

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
  await joinPresale({ name, phone, paymentPreference });
  return { ok: true, message: "Seu Oráculo está reservado. Vamos te chamar no WhatsApp para finalizar o pagamento." };
}
