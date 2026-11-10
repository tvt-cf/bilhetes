"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  CreditCard,
  Lock,
  MapPin,
  MapPinOff,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { cepAction, checkoutAction, startCheckoutAction, type Contact } from "@/app/actions";
import type { BoxColor } from "@/lib/db/schema";
import { produto } from "@/lib/site";
import { PixIcon } from "./pix-icon";
import { ContactFields, maskPhone } from "./forms";

// Compra em duas partes: a página pede nome e WhatsApp e o modal pede cor da caixa, endereço e pagamento.
export function CheckoutForm() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const c = { name: String(f.get("name") ?? "").trim(), phone: String(f.get("phone") ?? "") };
    start(async () => {
      const r = await startCheckoutAction(c);
      setError(r.ok ? null : r.message);
      if (r.ok) setContact(c);
    });
  }

  return (
    <>
      <form onSubmit={submit} className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <ContactFields tone="dark" />
        <button
          disabled={pending}
          className="mx-auto mt-2 flex w-full items-center justify-center gap-2.5 rounded-full bg-leveza px-10 py-5 text-base font-semibold text-vinho transition hover:bg-white active:scale-[0.98] disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Um instante…" : "Escolher minha caixa"} <span aria-hidden>→</span>
        </button>
        {error && (
          <p role="status" className="text-sm text-intuicao">
            {error}
          </p>
        )}
      </form>
      {contact && <CheckoutModal contact={contact} onClose={() => setContact(null)} />}
    </>
  );
}

type Lookup =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "found" | "outside"; city: string; state: string; neighborhood: string; street: string };

const cores: { value: BoxColor; nome: string; desc: string; foto: string }[] = [
  { value: "clara", nome: "Clara", desc: "Tom mel, veios suaves", foto: "/images/caixa-clara-2.jpg" },
  { value: "escura", nome: "Escura", desc: "Tom café, veios marcados", foto: "/images/caixa-escura-2.jpg" },
];
const etapas = ["Cor da caixa", "Endereço", "Pagamento"];
const field =
  "h-[52px] w-full rounded-xl border border-[#E3DAD2] bg-white px-4 text-base text-vinho outline-none transition placeholder:text-[#A39890] focus:border-vinho";

function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function CheckoutModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [color, setColor] = useState<BoxColor>("clara");
  const [cep, setCep] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [payment, setPayment] = useState<"a_vista" | "parcelado">("a_vista");
  const [error, setError] = useState<string | null>(null);
  const [reserved, setReserved] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [paying, startPay] = useTransition();
  const lastCep = useRef("");
  const numberRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);

  // trava a rolagem da página e fecha no Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function onCep(value: string) {
    const masked = maskCep(value);
    setCep(masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length < 8) {
      lastCep.current = "";
      setLookup({ status: "idle" });
      return;
    }
    if (digits === lastCep.current) return;
    lastCep.current = digits;
    setLookup({ status: "loading" });
    cepAction({ ...contact, cep: digits, boxColor: color })
      .then((r) => {
        if (lastCep.current !== digits) return; // a pessoa já digitou outro CEP
        if (!r.ok) return setLookup({ status: "error", message: r.message });
        const { info } = r;
        setLookup({ status: info.inArea ? "found" : "outside", ...info });
        setStreet(info.street);
        setNeighborhood(info.neighborhood);
        setEditing(!info.street || !info.neighborhood); // CEP único da cidade: a pessoa digita rua e bairro
        if (info.inArea && info.street) setTimeout(() => numberRef.current?.focus(), 50);
      })
      .catch(() => {
        if (lastCep.current === digits) setLookup({ status: "error", message: "Não conseguimos consultar o CEP agora. Tente de novo." });
      });
  }

  function otherCep() {
    lastCep.current = "";
    setCep("");
    setLookup({ status: "idle" });
    setTimeout(() => cepRef.current?.focus(), 50);
  }

  function pay() {
    setError(null);
    startPay(async () => {
      const teste = new URLSearchParams(window.location.search).get("teste") ?? undefined;
      const r = await checkoutAction({
        ...contact,
        boxColor: color,
        payment,
        cep,
        street,
        neighborhood,
        number,
        complement,
        teste,
      });
      if (!r.ok) return setError(r.message);
      if ("url" in r) {
        setRedirecting(true);
        window.location.href = r.url;
      } else setReserved(r.message);
    });
  }

  const outside = lookup.status === "outside";
  const addressOk = lookup.status === "found" && street.trim() && number.trim();
  const corNome = cores.find((c) => c.value === color)!.nome;
  const total = payment === "a_vista" ? produto.precoAVista.replace(/ à vista$/, "") : produto.preco;
  // no resumo do Pix, a linha do desconto explica a conta: preço do cartão menos o desconto
  const descontoPix = (produto.precoCentavos.parcelado - produto.precoCentavos.a_vista) / 100;

  return (
    // no celular o modal fica no topo (e não preso embaixo): em navegadores com barra, como o do Instagram,
    // o rodapé ia para baixo da dobra. O rodapé com o botão gruda embaixo quando o conteúdo rola.
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#1E0B12]/70 px-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-[6px] md:items-center md:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="flex max-h-[calc(100svh-24px)] w-full flex-col gap-6 overflow-y-auto rounded-3xl bg-[#FBF8F4] px-5 pt-5 text-left text-vinho shadow-[0_24px_64px_rgba(0,0,0,0.35)] md:max-w-[560px] md:gap-7 md:rounded-3xl md:px-8 md:pb-8 md:pt-6"
      >
        {/* topo: o pedido e o contato, para dar confiança */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-[10px] bg-vinho">
              <Image src="/images/oraculo-caixa-recorte.png" alt="" fill sizes="40px" className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Caixa de {produto.nome}</p>
              <p className="truncate text-xs text-[#7A6E68]">
                {step > 1 ? `Caixa ${corNome.toLowerCase()} · ${contact.name}` : `${contact.name} · ${maskPhone(contact.phone)}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F1EBE4] transition hover:bg-[#E9E1D8]"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        {/* navegador das etapas */}
        {!reserved && (
          <ol className="grid grid-cols-3 gap-2">
            {etapas.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n <= step && !(outside && n === 3);
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={!done || paying || redirecting}
                    onClick={() => setStep(n)}
                    className="flex w-full flex-col gap-2.5 text-left enabled:cursor-pointer"
                  >
                    <span className={`h-1 w-full rounded-full transition-colors ${active ? "bg-vinho" : "bg-[#ECE5DE]"}`} />
                    <span
                      className={`flex items-center gap-1.5 text-[13px] ${n === step ? "font-semibold" : ""} ${active ? "text-vinho" : "text-[#A39890]"}`}
                    >
                      {done && <Check className="size-3.5" strokeWidth={2.5} />}
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {reserved ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-3xl">Reservado.</p>
            <p className="max-w-sm text-sm text-[#7A6E68]">{reserved}</p>
          </div>
        ) : step === 1 ? (
          <Section
            title="Escolha a cor da sua caixa"
            sub="Feitas à mão em madeira natural. O tom e veios mudam a cada peça, preservando sua originalidade."
          >
            <div className="grid grid-cols-2 gap-3">
              {cores.map((c) => (
                <label
                  key={c.value}
                  className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-[#E3DAD2] p-2 pb-3.5 transition has-[:checked]:border-2 has-[:checked]:border-vinho has-[:checked]:bg-white has-[:checked]:p-[7px] has-[:checked]:pb-[13px]"
                >
                  <input type="radio" name="cor" value={c.value} checked={color === c.value} onChange={() => setColor(c.value)} className="sr-only" />
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[10px]">
                    <Image src={c.foto} alt={`Caixa ${c.nome.toLowerCase()}`} fill sizes="(min-width: 768px) 240px, 45vw" className="object-cover" />
                  </div>
                  <div className="flex items-center gap-2.5 px-1.5">
                    <Radio checked={color === c.value} />
                    <div>
                      <p className="text-[15px] font-semibold leading-tight">{c.nome}</p>
                      <p className="text-xs text-[#7A6E68]">{c.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Section>
        ) : step === 2 ? (
          <Section title="Para onde enviamos?" sub="Digite seu CEP e a gente completa o endereço. Você só informa o número e o complemento.">
            <Field
              label="CEP"
              aux={
                <a
                  href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Não sei meu CEP
                </a>
              }
            >
              <div className="relative">
                <input
                  ref={cepRef}
                  value={cep}
                  onChange={(e) => onCep(e.target.value)}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  aria-label="CEP"
                  autoFocus
                  className={`${field} pr-11 ${outside ? "border-[#D9B97C] focus:border-[#D9B97C]" : ""}`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  {lookup.status === "loading" && <span className="block size-4 animate-spin rounded-full border-2 border-vinho/20 border-t-vinho" />}
                  {lookup.status === "found" && <CircleCheck className="size-[18px] text-[#5E8C61]" />}
                  {(outside || lookup.status === "error") && <CircleAlert className="size-[18px] text-[#B07A2A]" />}
                </span>
              </div>
              {lookup.status === "error" && <p className="text-[13px] text-coragem">{lookup.message}</p>}
            </Field>

            {lookup.status === "found" && (
              <>
                {editing ? (
                  <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
                    <Field label="Rua">
                      <input value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="address-line1" className={field} />
                    </Field>
                    <Field label="Bairro">
                      <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={field} />
                    </Field>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-[#F1EBE4] p-4">
                    <MapPin className="size-[18px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{street}</p>
                      <p className="text-[13px] text-[#7A6E68]">
                        {neighborhood} · {lookup.city}, {lookup.state}
                      </p>
                    </div>
                    <button type="button" onClick={() => setEditing(true)} className="text-xs underline underline-offset-2">
                      Alterar
                    </button>
                  </div>
                )}
                {editing && (
                  <p className="-mt-2 text-[13px] text-[#7A6E68]">
                    {lookup.city}, {lookup.state}
                  </p>
                )}
                <div className="grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[150px_1fr]">
                  <Field label="Número">
                    <input
                      ref={numberRef}
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      autoComplete="address-line2"
                      inputMode="text"
                      className={field}
                    />
                  </Field>
                  <Field label="Complemento" aux={<span>opcional</span>}>
                    <input
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto, bloco, referência"
                      className={field}
                    />
                  </Field>
                </div>
                <p className="flex items-center gap-2 text-xs text-[#7A6E68]">
                  <Truck className="size-4" strokeWidth={1.75} /> {produto.frete}
                </p>
              </>
            )}

            {lookup.status === "outside" && (
              <>
                <div className="flex flex-col gap-3.5 rounded-2xl border border-[#EADBBE] bg-[#F6EEE0] p-4 md:p-[18px]">
                  <div className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EBDCC0]">
                      <MapPinOff className="size-[18px]" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-[15px] font-semibold">
                        Ainda não entregamos em {lookup.city}, {lookup.state}
                      </p>
                      <p className="text-[13px] leading-relaxed text-[#7A6E68]">
                        Essa edição só entrega na Grande São Paulo, mas em breve chegará em todo Brasil. Já guardamos seu pedido
                        e avisamos você no WhatsApp assim que ficar disponível.
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-[#E6D6B8]" />
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold tracking-[0.1em] text-[#9A7A45]">FILA DE ESPERA</p>
                    {[
                      `Caixa ${corNome.toLowerCase()}`,
                      `${contact.name} · ${maskPhone(contact.phone)}`,
                      `CEP ${cep} · ${lookup.city}, ${lookup.state}`,
                    ].map((t) => (
                      <p key={t} className="flex items-center gap-2.5 text-[13px]">
                        <Check className="size-3.5 shrink-0 text-[#5E8C61]" strokeWidth={2.5} /> {t}
                      </p>
                    ))}
                  </div>
                </div>
                <p className="text-[13px] text-[#7A6E68]">
                  Vai enviar para alguém na Grande SP?{" "}
                  <button type="button" onClick={otherCep} className="font-semibold text-vinho underline underline-offset-2">
                    Usar outro CEP
                  </button>
                </p>
              </>
            )}
          </Section>
        ) : (
          <Section title="Como você quer pagar?" sub="Você finaliza o pagamento no ambiente seguro da InfinitePay.">
            <div className="flex flex-col gap-2.5">
              {(
                [
                  ["a_vista", "À vista no Pix", "O desconto vai aparecer na tela final do Pix", produto.precoAVista.replace(/ à vista$/, "")],
                  ["parcelado", "Em até 3x no cartão", `Sem juros · total de ${produto.preco.replace(" ", "\u00a0")}`, produto.parcelas.replace(/ de /, " ")],
                ] as const
              ).map(([value, nome, detalhe, valor]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3.5 rounded-[14px] border border-[#E3DAD2] px-[18px] py-4 transition has-[:checked]:border-2 has-[:checked]:border-vinho has-[:checked]:bg-white has-[:checked]:px-[17px] has-[:checked]:py-[15px]"
                >
                  <input type="radio" name="pagamento" value={value} checked={payment === value} onChange={() => setPayment(value)} className="sr-only" />
                  <Radio checked={payment === value} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] font-semibold">{nome}</span>
                    <span className="text-xs text-[#7A6E68]">{detalhe}</span>
                  </span>
                  <span className={`whitespace-nowrap text-lg ${payment === value ? "font-semibold" : "font-medium"}`}>{valor}</span>
                </label>
              ))}
            </div>
            <dl className="flex flex-col gap-2.5 rounded-[14px] bg-[#F1EBE4] px-[18px] py-3.5 text-[13px]">
              <Row label={`Caixa de ${produto.nome} · ${corNome}`}>{produto.preco}</Row>
              {payment === "a_vista" && <Row label="Desconto Pix">−R$ {descontoPix}</Row>}
              <Row label="Entrega">
                {street}, {number}
                {complement ? ` · ${complement}` : ""}
                <br />
                {[neighborhood, lookup.status === "found" && `${lookup.city}, ${lookup.state}`, cep].filter(Boolean).join(" · ")}
              </Row>
              <Row label="Frete">
                <span className="text-[#4E7A52]">Grátis</span>
              </Row>
              <div className="h-px bg-[#DCD2C9]" />
              <div className="flex items-center justify-between font-semibold">
                <dt>Total</dt>
                <dd className="text-base">{total}</dd>
              </div>
            </dl>
            {error && <p className="text-[13px] text-coragem">{error}</p>}
          </Section>
        )}

        {/* rodapé: voltar e seguir */}
        <div className="sticky bottom-0 -mx-5 mt-auto flex flex-col gap-4 bg-[#FBF8F4] px-5 pb-5 pt-3 shadow-[0_-12px_16px_-14px_rgba(30,11,18,0.35)] md:static md:mx-0 md:p-0 md:shadow-none">
          <div className="flex items-center justify-between gap-4">
            {reserved || outside ? (
              <span />
            ) : step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={paying || redirecting}
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <ArrowLeft className="size-4" /> Voltar
              </button>
            ) : (
              <span className="text-[13px] text-[#7A6E68]">Etapa 1 de 3</span>
            )}
            {reserved || outside ? (
              <PrimaryButton onClick={onClose}>{outside ? "Combinado" : "Fechar"}</PrimaryButton>
            ) : step < 3 ? (
              <PrimaryButton onClick={() => setStep(step + 1)} disabled={step === 2 && !addressOk}>
                Continuar <ArrowRight className="size-4" />
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={pay} disabled={paying || redirecting}>
                <Lock className="size-4" /> {paying || redirecting ? "Abrindo pagamento…" : "Pagar com InfinitePay"}
              </PrimaryButton>
            )}
          </div>
          {step === 3 && !reserved && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[#7A6E68]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" strokeWidth={1.75} /> Pagamento seguro
              </span>
              <span className="flex items-center gap-1.5">
                <PixIcon className="size-3" /> Pix
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="size-3.5" strokeWidth={1.75} /> Cartão em até 3x
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 id="checkout-title" className="text-[22px] font-medium leading-tight tracking-[-0.02em] md:text-2xl">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-[#7A6E68]">{sub}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, aux, children }: { label: string; aux?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        {aux && <span className="text-[#7A6E68]">{aux}</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#7A6E68]">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`size-[18px] shrink-0 rounded-full bg-white ${checked ? "border-[5px] border-vinho" : "border-[1.5px] border-[#C9BEB5]"}`}
    />
  );
}

function PrimaryButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className="flex items-center gap-2.5 whitespace-nowrap rounded-full bg-vinho px-5 py-4 text-[15px] md:px-7 font-medium text-leveza transition hover:bg-vinho/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
