import { createHmac, timingSafeEqual } from "node:crypto";
import { recordReply, updateMessageStatus } from "@/lib/campaigns";
import { optOutByPhone } from "@/lib/community";
import type { MessageStatus } from "@/lib/db/schema";

// Verificação do webhook no painel da Meta.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

const statusMap: Record<string, MessageStatus> = {
  sent: "enviado",
  delivered: "entregue",
  read: "lido",
  failed: "falhou",
};

const OPT_OUT = /^\s*(sair|parar|pare|stop|cancelar|descadastrar)\s*$/i;

type WebhookBody = {
  entry?: {
    changes?: {
      value?: {
        statuses?: { id: string; status: string; errors?: { title?: string }[] }[];
        messages?: { from: string; type: string; text?: { body?: string }; button?: { text?: string } }[];
      };
    }[];
  }[];
};

function validSignature(raw: string, header: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // sem segredo configurado (dev), aceita
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from("sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex"));
  const got = Buffer.from(header);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("invalid signature", { status: 401 });
  }
  const body = JSON.parse(raw) as WebhookBody;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const s of change.value?.statuses ?? []) {
        const status = statusMap[s.status];
        if (status) await updateMessageStatus(s.id, status, s.errors?.[0]?.title);
      }
      for (const m of change.value?.messages ?? []) {
        const text = m.text?.body ?? m.button?.text ?? "";
        if (OPT_OUT.test(text) || /parar de receber/i.test(text)) await optOutByPhone(m.from);
        else await recordReply(m.from);
      }
    }
  }
  return Response.json({ ok: true });
}
