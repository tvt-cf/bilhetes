import { connection } from "next/server";
import { dispatchDue } from "@/lib/campaigns";

// Chamado pelo Vercel Cron (vercel.json). Envia as campanhas agendadas cujo horário já passou.
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const sent = await dispatchDue();
  return Response.json({ dispatched: sent });
}
