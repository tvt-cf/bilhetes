import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { countAudience, listCampaigns } from "@/lib/campaigns";
import type { CampaignKind, CampaignStatus, Segment } from "@/lib/db/schema";
import { cancelCampaignAction } from "../../actions";
import { Card, PageHeader, td, th } from "../ui";
import { Composer } from "./composer";

const KINDS: CampaignKind[] = ["sabedoria", "evento", "pedido"];
const SEGMENTS: Segment[] = ["comunidade", "pre_venda", "comprou"];

const segmentLabel: Record<Segment, string> = { comunidade: "Comunidade", pre_venda: "Pré-venda", comprou: "Compraram" };
const statusStyle: Record<CampaignStatus, [string, string]> = {
  agendado: ["Agendado", "bg-luz/20 text-[#7A5A1E]"],
  enviando: ["Enviando", "bg-recomeco/12 text-recomeco"],
  concluido: ["Concluído", "bg-presenca/15 text-[#4F5636]"],
  falhou: ["Falhou", "bg-coragem/12 text-[#A2402B]"],
};

const fmt = new Intl.NumberFormat("pt-BR");
const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default function EnviosPage() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Envios" subtitle="Mensagens de sabedoria, convites e avisos pelo WhatsApp." />
      <Suspense fallback={<Card className="h-[720px] animate-pulse" />}>
        <Envios />
      </Suspense>
    </div>
  );
}

async function Envios() {
  await requireAdmin();
  const audience = Object.fromEntries(
    await Promise.all(
      KINDS.map(async (k) => [
        k,
        Object.fromEntries(await Promise.all(SEGMENTS.map(async (s) => [s, await countAudience(k, [s])]))),
      ]),
    ),
  ) as Record<CampaignKind, Record<Segment, number>>;
  const history = await listCampaigns();

  return (
    <>
      <Composer audience={audience} />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-tinta/8 px-5 py-4">
          <h2 className="text-[15px] font-semibold">Histórico de envios</h2>
          <span className="text-[13px] text-tinta-suave">Lidas e entregas chegam pelo webhook da Meta</span>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-tinta-suave">Nenhum envio ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-tinta/8 bg-[#FAF8F5]">
                <tr>
                  {["MENSAGEM", "PÚBLICO", "DATA", "ENVIADAS", "ENTREGUES", "LIDAS", "RESPOSTAS", "STATUS", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta/6">
                {history.map((c) => {
                  const [label, cls] = statusStyle[c.status];
                  const dash = c.status === "agendado";
                  return (
                    <tr key={c.id}>
                      <td className={`${td} text-sm font-medium`}>{c.title}</td>
                      <td className={td}>{c.segments.map((s) => segmentLabel[s]).join(" + ")}</td>
                      <td className={td}>{fmtDate.format(c.scheduledAt)}</td>
                      <td className={td}>{dash ? "—" : fmt.format(c.total - c.failed)}</td>
                      <td className={td}>{dash ? "—" : fmt.format(c.delivered)}</td>
                      <td className={td}>{dash ? "—" : fmt.format(c.read)}</td>
                      <td className={td}>{dash ? "—" : fmt.format(c.replies)}</td>
                      <td className={td}>
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
                          {label}
                          {c.failed > 0 && c.status !== "falhou" ? ` · ${c.failed} falhas` : ""}
                          {c.simulated > 0 ? " · simulado" : ""}
                        </span>
                      </td>
                      <td className={td}>
                        {dash && (
                          <form action={cancelCampaignAction}>
                            <input type="hidden" name="campaignId" value={c.id} />
                            <button className="text-xs text-coragem hover:underline">Cancelar</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
