import type { MessageStatus, PersonStatus } from "@/lib/db/schema";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-[40px] leading-tight">{title}</h1>
        <p className="text-sm text-tinta-suave">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-tinta/8 bg-white ${className}`}>{children}</div>;
}

const statusStyle: Record<PersonStatus, [string, string]> = {
  comprou: ["Comprou", "bg-presenca/15 text-[#4F5636]"],
  pre_venda: ["Pré-venda", "bg-luz/20 text-[#7A5A1E]"],
  fila_espera: ["Fila de espera", "bg-intuicao/35 text-verdade"],
  comunidade: ["Comunidade", "bg-recomeco/12 text-recomeco"],
};

export function StatusBadge({ status, optedOut }: { status: PersonStatus; optedOut?: boolean }) {
  const [label, cls] = optedOut ? ["Descadastrou", "bg-coragem/12 text-[#A2402B]"] : statusStyle[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

const deliveryLabel: Record<MessageStatus, string> = {
  simulado: "simulado",
  enviado: "enviado",
  entregue: "entregue",
  lido: "lido",
  falhou: "falhou",
};

export function DeliveryText({ title, status }: { title: string | null; status: MessageStatus | null }) {
  if (!title || !status) return <span className="text-[#9a938c]">—</span>;
  const color = status === "falhou" ? "text-coragem" : status === "lido" ? "text-recomeco" : "text-tinta";
  return (
    <span className={`text-[13px] ${color}`}>
      {status === "lido" ? "✓✓ " : status === "falhou" ? "! " : ""}
      {title} · {deliveryLabel[status]}
    </span>
  );
}

export const th = "px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-[#9a938c] first:pl-5 last:pr-5";
export const td = "px-3 py-3.5 text-[13px] first:pl-5 last:pr-5";
