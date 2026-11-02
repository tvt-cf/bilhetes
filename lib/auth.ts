import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb, schema } from "./db";
import { sendLoginEmail } from "./email";

// Acesso ao /admin por e-mail: quem está em ADMIN_EMAILS recebe um código de 6 dígitos e um link mágico.
// A sessão é um cookie assinado com SESSION_SECRET que guarda o e-mail; tirar o e-mail da lista corta o acesso.
const COOKIE = "bilhetes_admin";
const MAX_AGE = 60 * 60 * 24 * 14;
const CODE_TTL_MIN = 15;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_HOUR = 5;

const { loginCodes } = schema;

function secret() {
  const s = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : "dev-secret");
  if (!s) throw new Error("SESSION_SECRET não configurado");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// Lista de quem pode entrar. Em desenvolvimento, sem ADMIN_EMAILS, qualquer e-mail entra.
export function isAllowedEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map(normalizeEmail)
    .filter(Boolean);
  if (!list.length) return process.env.NODE_ENV !== "production";
  return list.includes(normalizeEmail(email));
}

// Pede acesso: gera código e link e manda por e-mail. Não revela se o e-mail está na lista.
export async function requestLogin(rawEmail: string, origin: string) {
  const email = normalizeEmail(rawEmail);
  if (!isAllowedEmail(email)) return;

  const db = await getDb();
  const [recent] = await db
    .select({ n: sql<number>`count(*)` })
    .from(loginCodes)
    .where(and(eq(loginCodes.email, email), gt(loginCodes.createdAt, sql`now() - interval '1 hour'`)));
  if (Number(recent?.n ?? 0) >= MAX_CODES_PER_HOUR) return;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const token = randomBytes(32).toString("base64url");
  // só o código mais recente vale
  await db.update(loginCodes).set({ usedAt: new Date() }).where(and(eq(loginCodes.email, email), isNull(loginCodes.usedAt)));
  await db.insert(loginCodes).values({
    email,
    codeHash: sign(`code:${email}:${code}`),
    tokenHash: sign(`token:${token}`),
    expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
  });
  await sendLoginEmail(email, code, `${origin}/admin/entrar?token=${token}`);
}

export async function verifyCode(rawEmail: string, code: string) {
  const email = normalizeEmail(rawEmail);
  const db = await getDb();
  const [row] = await db
    .select()
    .from(loginCodes)
    .where(and(eq(loginCodes.email, email), isNull(loginCodes.usedAt), gt(loginCodes.expiresAt, new Date())))
    .orderBy(desc(loginCodes.createdAt))
    .limit(1);
  if (!row || row.attempts >= MAX_ATTEMPTS) return false;

  if (!safeEqual(row.codeHash, sign(`code:${email}:${code.replace(/\D/g, "")}`))) {
    await db.update(loginCodes).set({ attempts: row.attempts + 1 }).where(eq(loginCodes.id, row.id));
    return false;
  }
  return consume(row.id, email);
}

export async function verifyToken(token: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(loginCodes)
    .where(
      and(eq(loginCodes.tokenHash, sign(`token:${token}`)), isNull(loginCodes.usedAt), gt(loginCodes.expiresAt, new Date())),
    );
  if (!row) return false;
  return consume(row.id, row.email);
}

async function consume(id: number, email: string) {
  if (!isAllowedEmail(email)) return false;
  const db = await getDb();
  const [used] = await db
    .update(loginCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(loginCodes.id, id), isNull(loginCodes.usedAt)))
    .returning({ id: loginCodes.id });
  if (!used) return false; // já usado em outra aba
  await startSession(email);
  return true;
}

async function startSession(email: string) {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = `${expires}.${Buffer.from(email).toString("base64url")}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

// E-mail de quem está logada, ou null.
export async function getAdmin(): Promise<{ email: string } | null> {
  await connection(); // a checagem de validade usa o relógio: sempre em tempo de requisição
  const value = (await cookies()).get(COOKIE)?.value;
  const [expires, emailB64, sig] = value?.split(".") ?? [];
  if (!sig || !safeEqual(sig, sign(`${expires}.${emailB64}`)) || Number(expires) <= Date.now()) return null;
  const email = Buffer.from(emailB64, "base64url").toString();
  return isAllowedEmail(email) ? { email } : null;
}

export async function isAdmin() {
  return (await getAdmin()) !== null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
