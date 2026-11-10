import type { BoxColor, DeliveryAddress, DeliveryStatus, OrderStatus } from "@/lib/db/schema";
import { tagOk } from "../ui";

export type OrderRow = {
  id: number;
  name: string | null;
  phone: string | null;
  orderNumber: string | null;
  paymentPreference: "a_vista" | "parcelado";
  boxColor: BoxColor | null;
  address: DeliveryAddress | null;
  amount: number;
  status: OrderStatus;
  paidAmount: number | null;
  installments: number | null;
  captureMethod: string | null;
  transactionNsu: string | null;
  receiptUrl: string | null;
  checkedAt: Date | null;
  createdAt: Date;
  archivedAt: Date | null;
  deliveredAt: Date | null;
  deliveryStatus: DeliveryStatus | null;
  carrier: string | null;
  deliveryOwner: string | null;
  complaint: string | null;
};

export const statusStyle: Record<OrderStatus, [string, string]> = {
  aguardando: ["Aguardando", "bg-luz/20 text-[#7A5A1E]"],
  pago: ["Pago", tagOk],
  divergente: ["Divergente", "bg-coragem/12 text-[#A2402B]"],
};

export const boxStyle: Record<BoxColor, [string, string]> = {
  clara: ["Clara", "#C9A06A"],
  escura: ["Escura", "#5B3B27"],
};

export const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtCep = (cep: string) => cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
export const optionLabel = (o: OrderRow) => (o.paymentPreference === "a_vista" ? "À vista" : "Parcelado");
export const methodLabel = (o: OrderRow) =>
  o.captureMethod === "pix"
    ? "Pix"
    : o.captureMethod === "credit_card"
      ? `Cartão${o.installments ? ` ${o.installments}x` : ""}`
      : "";

// Etapas da entrega (pedido pago sem etapa = preparar), na ordem do fluxo.
export const deliveryStyle: Record<DeliveryStatus, [string, string]> = {
  preparar: ["Preparar", "bg-tinta/8 text-tinta"],
  coletar: ["Coletar", "bg-luz/25 text-[#7A5A1E]"],
  despachado: ["Despachado", "bg-recomeco/12 text-recomeco"],
  entregue: ["Entregue", tagOk],
  reclamacao: ["Reclamação", "bg-coragem/12 text-[#A2402B]"],
};
export const deliveryOf = (o: OrderRow): DeliveryStatus | null =>
  o.status === "pago" && !o.archivedAt ? (o.deliveryStatus ?? "preparar") : null;
export const deliveryOrder = Object.keys(deliveryStyle) as DeliveryStatus[];
