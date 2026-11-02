import "server-only";
import type { CampaignKind } from "./db/schema";

// Envio pela WhatsApp Cloud API (Meta). Mensagens para quem não falou com a conta nas últimas 24h
// precisam usar um template aprovado. Cada tipo de envio usa um template com uma variável {{1}}.
const GRAPH_VERSION = "v23.0";

const templateByKind: Record<CampaignKind, string | undefined> = {
  sabedoria: process.env.WHATSAPP_TEMPLATE_SABEDORIA,
  evento: process.env.WHATSAPP_TEMPLATE_EVENTO,
  pedido: process.env.WHATSAPP_TEMPLATE_PEDIDO,
  lote: process.env.WHATSAPP_TEMPLATE_LOTE,
};

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

// A Meta rejeita parâmetros de template com quebra de linha, tab ou mais de 4 espaços seguidos.
export function toTemplateParam(text: string): string {
  return text.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
}

export type SendResult =
  | { ok: true; simulated: boolean; waMessageId: string | null }
  | { ok: false; error: string };

export async function sendTemplate(kind: CampaignKind, to: string, text: string): Promise<SendResult> {
  const template = templateByKind[kind];
  if (!whatsappConfigured() || !template) {
    return { ok: true, simulated: true, waMessageId: null };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "pt_BR" },
          components: [{ type: "body", parameters: [{ type: "text", text: toTemplateParam(text) }] }],
        },
      }),
    },
  );

  const data = (await res.json().catch(() => ({}))) as {
    messages?: { id: string }[];
    error?: { message?: string; code?: number };
  };
  if (!res.ok || !data.messages?.[0]?.id) {
    return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
  }
  return { ok: true, simulated: false, waMessageId: data.messages[0].id };
}
