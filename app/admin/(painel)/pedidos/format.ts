import type { BoxColor, DeliveryAddress, OrderStatus } from "@/lib/db/schema";

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
};

export const statusStyle: Record<OrderStatus, [string, string]> = {
  aguardando: ["Aguardando", "bg-luz/20 text-[#7A5A1E]"],
  pago: ["Pago", "bg-presenca/15 text-[#4F5636]"],
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
