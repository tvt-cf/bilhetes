import "server-only";

// E-mail de acesso ao /admin, enviado pela API do Resend (RESEND_API_KEY).
// Sem a chave, fora da Vercel o código e o link aparecem no terminal; na Vercel o envio falha.
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendLoginEmail(to: string, code: string, link: string) {
  if (!emailConfigured()) {
    if (process.env.VERCEL) throw new Error("RESEND_API_KEY não configurado");
    console.log(`\n[login] ${to}\n  código: ${code}\n  link:   ${link}\n`);
    return;
  }

  const html = `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;color:#2B2A28;background:#F4F0EB">
  <p style="font-family:Georgia,serif;font-size:28px;color:#5B1F2E;margin:0 0 24px">bilhetes · admin</p>
  <p style="font-size:15px;line-height:1.5;margin:0 0 16px">Seu código de acesso:</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:700;color:#5B1F2E;margin:0 0 24px">${code}</p>
  <p style="font-size:15px;line-height:1.5;margin:0 0 16px">Ou entre direto por este botão:</p>
  <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#5B1F2E;color:#F4F0EB;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">Entrar no admin</a></p>
  <p style="font-size:13px;line-height:1.5;color:#6B6660;margin:0">O código e o link valem por 15 minutos e só funcionam uma vez. Se você não pediu este acesso, pode ignorar este e-mail.</p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM ?? "bilhetes <acesso@bilhetes.co>",
      to,
      subject: `${code} é seu código de acesso ao admin`,
      html,
      text: `Seu código de acesso ao admin da bilhetes: ${code}\n\nOu entre por este link: ${link}\n\nVale por 15 minutos e só funciona uma vez.`,
    }),
  });
  if (!res.ok) throw new Error(`Resend: HTTP ${res.status} ${await res.text().catch(() => "")}`);
}
