import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// status de uma pessoa na jornada: comunidade -> fila de espera (se esgotado) -> pré-venda -> comprou
export type PersonStatus = "comunidade" | "fila_espera" | "pre_venda" | "comprou";

export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name"),
  phone: text("phone").notNull().unique(), // E.164 sem "+", ex: 5511984221037
  source: text("source").notNull().default("landing"),
  wantsEvents: boolean("wants_events").notNull().default(true),
  wantsWisdom: boolean("wants_wisdom").notNull().default(true),
  status: text("status").$type<PersonStatus>().notNull().default("comunidade"),
  paymentPreference: text("payment_preference"), // "a_vista" | "parcelado"
  presaleAt: timestamp("presale_at", { withTimezone: true }),
  waitlistAt: timestamp("waitlist_at", { withTimezone: true }),
  orderNumber: text("order_number"),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
  // CEP fora da Grande São Paulo: guardamos o pedido para avisar quando a entrega chegar lá
  outsideArea: jsonb("outside_area").$type<OutsideArea>(),
  outsideAreaAt: timestamp("outside_area_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BoxColor = "clara" | "escura";
export type OutsideArea = { cep: string; city: string; uf: string; boxColor: BoxColor };
export type DeliveryAddress = {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type CampaignKind = "sabedoria" | "evento" | "pedido" | "lote";
export type CampaignStatus = "agendado" | "enviando" | "concluido" | "falhou";
export type Segment = PersonStatus;

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  kind: text("kind").$type<CampaignKind>().notNull(),
  segments: jsonb("segments").$type<Segment[]>().notNull(),
  body: text("body").notNull(),
  status: text("status").$type<CampaignStatus>().notNull().default("agendado"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdBy: text("created_by"), // e-mail de quem criou no /admin
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Códigos de acesso ao /admin (código de 6 dígitos + link mágico), guardados só como hash.
export const loginCodes = pgTable("login_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MessageStatus = "enviado" | "entregue" | "lido" | "falhou" | "simulado";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  personId: integer("person_id").notNull(),
  waMessageId: text("wa_message_id").unique(),
  status: text("status").$type<MessageStatus>().notNull(),
  error: text("error"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Um pedido por checkout aberto na InfinitePay. order_nsu = "pedido-<id>". "divergente": a InfinitePay confirmou
// um valor diferente do cobrado, ou deixou de confirmar um pagamento numa nova conferência.
export type OrderStatus = "aguardando" | "pago" | "divergente";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  paymentPreference: text("payment_preference").$type<"a_vista" | "parcelado">().notNull(),
  amount: integer("amount").notNull(), // centavos
  boxColor: text("box_color").$type<BoxColor>(),
  address: jsonb("address").$type<DeliveryAddress>(),
  checkoutUrl: text("checkout_url"),
  status: text("status").$type<OrderStatus>().notNull().default("aguardando"),
  paidAmount: integer("paid_amount"),
  installments: integer("installments"),
  captureMethod: text("capture_method"), // "pix" | "credit_card"
  transactionNsu: text("transaction_nsu"),
  invoiceSlug: text("invoice_slug"),
  receiptUrl: text("receipt_url"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }), // arquivado no admin (ex.: pedido de teste)
});

// Histórico de cada pedido, mostrado na linha do tempo do /admin/pedidos.
// via: quem disparou (cliente, webhook da InfinitePay, retorno para /obrigada, admin); actor: e-mail do admin.
export type OrderEventKind = "criado" | "link" | "status" | "conferido" | "arquivado" | "desarquivado";
export type OrderEventVia = "cliente" | "webhook" | "retorno" | "admin";
export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  kind: text("kind").$type<OrderEventKind>().notNull(),
  via: text("via").$type<OrderEventVia>().notNull(),
  actor: text("actor"),
  detail: jsonb("detail").$type<{ from?: OrderStatus; to?: OrderStatus; paidAmount?: number | null; method?: string | null }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Configurações do site editáveis no /admin (ex.: vendas esgotadas).
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

// Criação idempotente das tabelas. Evita depender de um passo de migração para subir o projeto.
export const bootstrapSql = `
create table if not exists people (
  id serial primary key,
  name text,
  phone text not null unique,
  source text not null default 'landing',
  wants_events boolean not null default true,
  wants_wisdom boolean not null default true,
  status text not null default 'comunidade',
  payment_preference text,
  presale_at timestamptz,
  order_number text,
  purchased_at timestamptz,
  opted_out_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists campaigns (
  id serial primary key,
  title text not null,
  kind text not null,
  segments jsonb not null,
  body text not null,
  status text not null default 'agendado',
  scheduled_at timestamptz not null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists messages (
  id serial primary key,
  campaign_id integer not null,
  person_id integer not null,
  wa_message_id text unique,
  status text not null,
  error text,
  replied_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists messages_campaign_idx on messages (campaign_id);
create index if not exists messages_person_idx on messages (person_id);
alter table people add column if not exists waitlist_at timestamptz;
alter table campaigns add column if not exists created_by text;
create table if not exists login_codes (
  id serial primary key,
  email text not null,
  code_hash text not null,
  token_hash text not null unique,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists login_codes_email_idx on login_codes (email, created_at);
create table if not exists settings (
  key text primary key,
  value jsonb not null
);
create table if not exists orders (
  id serial primary key,
  person_id integer not null,
  payment_preference text not null,
  amount integer not null,
  checkout_url text,
  status text not null default 'aguardando',
  paid_amount integer,
  installments integer,
  capture_method text,
  transaction_nsu text,
  invoice_slug text,
  receipt_url text,
  paid_at timestamptz,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists orders_person_idx on orders (person_id);
alter table people add column if not exists outside_area jsonb;
alter table people add column if not exists outside_area_at timestamptz;
alter table orders add column if not exists box_color text;
alter table orders add column if not exists address jsonb;
alter table orders add column if not exists archived_at timestamptz;
create table if not exists order_events (
  id serial primary key,
  order_id integer not null,
  kind text not null,
  via text not null,
  actor text,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on order_events (order_id, created_at);
`;
