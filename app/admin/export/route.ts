import { isAdmin } from "@/lib/auth";
import { listPeople } from "@/lib/community";

const statusLabel = { comunidade: "Comunidade", pre_venda: "Pré-venda", comprou: "Comprou" } as const;

function cell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAdmin())) return new Response("unauthorized", { status: 401 });
  const rows = await listPeople({ segment: "todos", limit: 100_000 });
  const header = ["nome", "whatsapp", "status", "eventos", "sabedoria", "origem", "pagamento", "pedido", "cadastro"];
  const lines = rows.map((p) =>
    [
      p.name,
      "+" + p.phone,
      statusLabel[p.status],
      p.wantsEvents ? "sim" : "não",
      p.wantsWisdom ? "sim" : "não",
      p.source,
      p.paymentPreference,
      p.orderNumber,
      p.createdAt.toISOString(),
    ]
      .map(cell)
      .join(","),
  );
  return new Response("﻿" + [header.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bilhetes-comunidade.csv"',
    },
  });
}
