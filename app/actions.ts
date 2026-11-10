"use server";

import { type CepInfo, lookupCep } from "@/lib/cep";
import { joinOutsideArea, joinPresale, joinWaitlist, subscribe } from "@/lib/community";
import type { BoxColor, DeliveryAddress } from "@/lib/db/schema";
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

// Checkout em etapas: a página pede nome e WhatsApp (startCheckoutAction) e o modal pede a cor da caixa,
// o endereço pelo CEP (cepAction) e a forma de pagamento (checkoutAction).
export type Contact = { name: string; phone: string };
type Fail = { ok: false; message: string };

function readContact(input: Contact): Contact | Fail {
  const name = String(input.name ?? "").trim();
  const phone = normalizePhone(String(input.phone ?? ""));
  if (!name) return { ok: false, message: "Como podemos te chamar?" };
  if (!phone) return { ok: false, message: "Confira o número: DDD + celular, ex. (11) 98765-4321." };
  return { name, phone };
}

const soldOutMessage =
  "Esgotou agora há pouco. Você entrou na fila de espera e avisamos no WhatsApp quando o próximo lote chegar.";

// Guarda o contato antes de abrir o modal: quem desistir no meio ainda pode ser chamada no WhatsApp.
export async function startCheckoutAction(input: Contact): Promise<{ ok: true } | Fail> {
  const contact = readContact(input);
  if ("ok" in contact) return contact;
  // a página pode estar em cache: confere o estoque real antes de seguir
  if ((await getStockLive()).soldOut) {
    await joinWaitlist(contact);
    return { ok: false, message: soldOutMessage };
  }
  await joinPresale(contact);
  return { ok: true };
}

export type CepResult = { ok: true; info: CepInfo } | Fail;

// Completa o endereço pelo CEP. Fora da Grande São Paulo, já guarda o pedido na fila de espera.
export async function cepAction(input: Contact & { cep: string; boxColor: BoxColor }): Promise<CepResult> {
  const contact = readContact(input);
  if ("ok" in contact) return contact;
  let info: CepInfo | null;
  try {
    info = await lookupCep(input.cep);
  } catch (e) {
    console.error(e);
    return { ok: false, message: "Não conseguimos consultar o CEP agora. Tente de novo em instantes." };
  }
  if (!info) return { ok: false, message: "Não encontramos esse CEP. Confira os números." };
  if (!info.inArea) {
    await joinOutsideArea({ ...contact, cep: info.cep, city: info.city, uf: info.state, boxColor: boxColor(input.boxColor) });
  }
  return { ok: true, info };
}

const boxColor = (v: unknown): BoxColor => (v === "escura" ? "escura" : "clara");

export async function checkoutAction(
  input: Contact & {
    boxColor: BoxColor;
    payment: "a_vista" | "parcelado";
    cep: string;
    street: string;
    neighborhood: string;
    number: string;
    complement: string;
    teste?: string;
  },
): Promise<{ ok: true; url: string } | { ok: true; message: string } | Fail> {
  const contact = readContact(input);
  if ("ok" in contact) return contact;
  const { name, phone } = contact;
  const paymentPreference = input.payment === "parcelado" ? "parcelado" : "a_vista";
  const number = String(input.number ?? "").trim();
  if (!number) return { ok: false, message: "Falta o número do endereço." };

  // o endereço vale o que o ViaCEP disser; rua e bairro digitados só entram quando o CEP não traz (CEP único)
  let info: CepInfo | null;
  try {
    info = await lookupCep(input.cep);
  } catch (e) {
    console.error(e);
    return { ok: false, message: "Não conseguimos consultar o CEP agora. Tente de novo em instantes." };
  }
  if (!info) return { ok: false, message: "Não encontramos esse CEP. Confira os números." };
  if (!info.inArea) return { ok: false, message: "Por enquanto entregamos só na Grande São Paulo." };
  const address: DeliveryAddress = {
    cep: info.cep,
    street: info.street || String(input.street ?? "").trim(),
    neighborhood: info.neighborhood || String(input.neighborhood ?? "").trim(),
    number,
    complement: String(input.complement ?? "").trim(),
    city: info.city,
    state: info.state,
  };
  if (!address.street) return { ok: false, message: "Falta o nome da rua." };

  const stock = await getStockLive();
  if (stock.soldOut) {
    await joinWaitlist({ name, phone });
    return { ok: false, message: soldOutMessage };
  }
  // a cor pode ter esgotado enquanto a pessoa preenchia o endereço
  const color = boxColor(input.boxColor);
  if (stock.colorSoldOut[color]) {
    return { ok: false, message: `A caixa ${color} acabou de esgotar. Volte para a primeira etapa e escolha a outra cor.` };
  }
  const personId = await joinPresale({ name, phone, paymentPreference });
  // TEMPORÁRIO (teste do checkout): quem abre o site com ?teste=<TESTE_CHECKOUT_TOKEN> paga R$ 1.
  // O token fica só na Vercel (o repositório é público). Sem a variável, o teste fica desligado.
  const token = process.env.TESTE_CHECKOUT_TOKEN;
  const ehTeste = Boolean(token) && input.teste === token;
  const reserved = "Sua caixa de Bilhetes está reservada. Vamos te chamar no WhatsApp para finalizar o pagamento.";

  // com a InfinitePay configurada, vai direto para o checkout; sem ela, segue a reserva pelo WhatsApp
  if (!infinitepayConfigured()) return { ok: true, message: reserved };
  try {
    const order = await createOrder({
      personId,
      paymentPreference,
      boxColor: color,
      address,
      amount: ehTeste ? 100 : undefined,
    });
    const url = await createCheckoutLink({ orderId: order.id, amount: order.amount, name, phone, paymentPreference, address, teste: ehTeste });
    await setCheckoutUrl(order.id, url);
    return { ok: true, url };
  } catch (e) {
    console.error(e);
    return { ok: true, message: "Sua caixa de Bilhetes está reservada. O pagamento não abriu agora, então vamos te chamar no WhatsApp para finalizar." };
  }
}

export async function waitlistAction(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  if (!name) return { ok: false, message: "Como podemos te chamar?" };
  if (!phone) return { ok: false, message: "Confira o número: DDD + celular, ex. (11) 98765-4321." };
  await joinWaitlist({ name, phone });
  return { ok: true, message: "Você está na fila. Avisamos no WhatsApp assim que o próximo lote estiver disponível." };
}
