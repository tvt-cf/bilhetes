// Normaliza telefones brasileiros para E.164 sem "+": 55 + DDD + número.
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  if (!digits.startsWith("55") || (digits.length !== 12 && digits.length !== 13)) return null;
  return digits;
}

export function formatPhone(e164: string): string {
  const d = e164.replace(/^55/, "");
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const split = rest.length === 9 ? 5 : 4;
  return `+55 ${ddd} ${rest.slice(0, split)}-${rest.slice(split)}`;
}
