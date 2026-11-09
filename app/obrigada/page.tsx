import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Eyebrow } from "@/components/site/chrome";
import { Logo } from "@/components/site/logo";
import { confirmOrderOnReturn } from "@/lib/orders";
import { produto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pedido · bilhetes",
  robots: { index: false },
};

const falarNoInstagram = "https://ig.me/m/bilhetes.co";
const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents % 100 ? 2 : 0,
  });

type Pedido = NonNullable<Awaited<ReturnType<typeof confirmOrderOnReturn>>>;

// Para onde a InfinitePay manda a pessoa depois do pagamento (redirect_url), com
// ?order_nsu=pedido-12&transaction_nsu=…&slug=…&receipt_url=…&capture_method=pix|credit_card
export default function ObrigadaPage({ searchParams }: PageProps<"/obrigada">) {
  return (
    <div className="flex min-h-svh flex-col bg-leveza">
      <header className="border-b border-verdade/10">
        <div className="mx-auto flex items-center px-5 py-4 md:max-w-[calc(var(--largura)+8rem)] md:px-16 md:py-6">
          <Link
            href="/"
            aria-label="bilhetes, página inicial"
            className="text-verdade"
          >
            <Logo tagline={false} className="w-[108px] md:w-[132px]" />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center px-5 pb-16 pt-10 md:px-16 md:py-16">
        <Suspense fallback={null}>
          <Conteudo searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Conteudo({
  searchParams,
}: {
  searchParams: PageProps<"/obrigada">["searchParams"];
}) {
  const params = await searchParams;
  const get = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : undefined;

  // só para ver os dois estados no desenvolvimento: /obrigada?preview=pago ou ?preview=aguardando
  const preview =
    process.env.NODE_ENV !== "production" ? get("preview") : undefined;
  let pedido: Pedido | null;
  try {
    pedido = preview
      ? {
          id: 128,
          status: preview === "pago" ? "pago" : "aguardando",
          paymentPreference: "a_vista",
          amount: produto.precoCentavos.parcelado,
          paidAmount: produto.precoCentavos.a_vista,
          installments: 1,
          captureMethod: "pix",
          receiptUrl: "https://checkout.infinitepay.io",
        }
      : await confirmOrderOnReturn({
          orderNsu: get("order_nsu") ?? "",
          transactionNsu: get("transaction_nsu"),
          slug: get("slug"),
          receiptUrl: get("receipt_url"),
        });
  } catch (e) {
    // se a conferência falhar, quem acabou de pagar vê "em confirmação" (o webhook confirma depois)
    console.error(e);
    pedido = get("order_nsu")?.startsWith("pedido-")
      ? {
          id: Number(get("order_nsu")!.slice(7)) || 0,
          status: "aguardando",
          paymentPreference: "a_vista",
          amount: 0,
          paidAmount: null,
          installments: null,
          captureMethod: null,
          receiptUrl: null,
        }
      : null;
  }
  if (!pedido) redirect("/");

  const pago = pedido.status === "pago";
  const pix = (pedido.captureMethod ?? get("capture_method")) === "pix";
  // valor pago: o que a InfinitePay confirmou; senão o cobrado no pedido (no Pix, o preço cheio vira o preço à vista)
  const valor =
    pedido.paidAmount ??
    (pix && pedido.amount === produto.precoCentavos.parcelado
      ? produto.precoCentavos.a_vista
      : pedido.amount);
  const forma = pix
    ? "Pago no Pix"
    : `Pago no cartão${pedido.installments && pedido.installments > 1 ? ` em ${pedido.installments}x` : ""}`;
  // comprovante: o que a InfinitePay confirmou; senão o do retorno, se for mesmo da InfinitePay
  const doRetorno = get("receipt_url");
  const comprovante =
    pedido.receiptUrl ??
    (doRetorno && /^https:\/\/[^/]*infinitepay\.io\//.test(doRetorno)
      ? doRetorno
      : undefined);

  return (
    <div className="largura flex flex-col gap-10 md:flex-row-reverse md:items-center md:gap-16">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md md:aspect-[380/500] md:w-[380px] md:shrink-0">
        <Image
          src="/images/produto-caixa-cartas.jpg"
          alt="A caixa de madeira gravada ao lado de um leque de bilhetes coloridos"
          fill
          priority
          sizes="(min-width: 768px) 380px, 100vw"
          className="object-cover object-[50%_72%] md:object-center"
        />
      </div>
      <div className="flex flex-1 flex-col gap-6">
        <Eyebrow className="text-verdade">
          {pago ? "PEDIDO CONFIRMADO" : "PAGAMENTO EM CONFIRMAÇÃO"}
        </Eyebrow>
        <h1 className="text-[34px] leading-[1.08] tracking-[-0.02em] text-tinta md:text-[clamp(34px,3.1vw,46px)]">
          {pago ? (
            <>
              Sua Caixa de Bilhetes
              <br />
              está garantida <span className="text-verdade">♡</span>
            </>
          ) : (
            <>
              Estamos confirmando
              <br />
              seu pagamento <span className="text-verdade">♡</span>
            </>
          )}
        </h1>
        <p className="max-w-[560px] text-[17px] leading-relaxed text-tinta-suave">
          {pago
            ? "Vamos prepará-la com muito carinho! Recebemos seu pagamento e, em até 15 dias, sua caixinha será entregue. Manteremos você atualizado pelo WhatsApp."
            : "Isso pode levar alguns minutos. Assim que o pagamento for confirmado, avisamos você pelo WhatsApp e começamos a preparar sua caixinha com muito carinho."}
        </p>
        <div className="flex flex-col gap-1.5 border-y border-verdade/15 py-4">
          <span className="text-[15px] font-medium text-tinta">
            Caixa de {produto.nome} Nº 01
          </span>
          <span className="text-[13px] text-tinta-suave">
            Pedido nº {pedido.id}
            {pago && (
              <>
                {" "}
                · {forma} · {brl(valor)}
              </>
            )}
          </span>
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-6 md:mt-0 md:flex-row md:items-center md:gap-7">
          {comprovante && (
            <a
              href={comprovante}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-13 items-center justify-center rounded-full bg-verdade px-7 text-[15px] font-semibold text-leveza transition hover:bg-verdade/90 active:scale-[0.98]"
            >
              Ver comprovante
            </a>
          )}
          <div className="flex items-center justify-center gap-3.5 text-sm font-medium text-verdade">
            <Link
              href="/"
              className="underline underline-offset-4 hover:text-verdade/80"
            >
              Voltar para o site
            </Link>
            <span aria-hidden className="text-verdade/40">
              ·
            </span>
            <a
              href={falarNoInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-verdade/80"
            >
              Fale conosco
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
