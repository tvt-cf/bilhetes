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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
create table if not exists settings (
  key text primary key,
  value jsonb not null
);
`;
