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

  // faixa bege na largura toda; o conteúdo fica numa coluna de até 480px, que encolhe no celular
  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F0EB">
  <tr>
    <td align="center" style="padding:48px 20px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;font-family:Helvetica,Arial,sans-serif;color:#2B2A28">
        <tr><td style="font-family:Georgia,serif;font-size:28px;color:#5B1F2E;padding:0 0 28px">bilhetes · admin</td></tr>
        <tr><td style="font-size:15px;line-height:1.5;padding:0 0 12px">Seu código de acesso:</td></tr>
        <tr><td style="font-size:34px;letter-spacing:8px;font-weight:700;color:#5B1F2E;padding:0 0 28px">${code}</td></tr>
        <tr><td style="font-size:15px;line-height:1.5;padding:0 0 16px">Ou entre direto por este botão:</td></tr>
        <tr><td style="padding:0 0 32px"><a href="${link}" style="display:inline-block;background:#5B1F2E;color:#F4F0EB;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">Entrar no admin</a></td></tr>
        <tr><td style="font-size:13px;line-height:1.5;color:#6B6660">O código e o link valem por 15 minutos e só funcionam uma vez. Se você não pediu este acesso, pode ignorar este e-mail.</td></tr>
      </table>
    </td>
  </tr>
</table>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM ?? "bilhetes <admin@bilhetes.co>",
      to,
      subject: `${code} é seu código de acesso ao admin`,
      html,
      text: `Seu código de acesso ao admin da bilhetes: ${code}\n\nOu entre por este link: ${link}\n\nVale por 15 minutos e só funciona uma vez.`,
    }),
  });
  if (!res.ok) throw new Error(`Resend: HTTP ${res.status} ${await res.text().catch(() => "")}`);
}
