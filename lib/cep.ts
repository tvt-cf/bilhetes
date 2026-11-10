import "server-only";

// Endereço pelo CEP (ViaCEP) e a área de entrega. A entrega é só na Grande São Paulo: os 39 municípios da
// Região Metropolitana, pelo código IBGE que o ViaCEP devolve (mais seguro que faixa de CEP).
const GRANDE_SP = new Set([
  "3503901", // Arujá
  "3505708", // Barueri
  "3506607", // Biritiba Mirim
  "3509007", // Caieiras
  "3509205", // Cajamar
  "3510609", // Carapicuíba
  "3513009", // Cotia
  "3513801", // Diadema
  "3515004", // Embu das Artes
  "3515103", // Embu-Guaçu
  "3515707", // Ferraz de Vasconcelos
  "3516309", // Francisco Morato
  "3516408", // Franco da Rocha
  "3518305", // Guararema
  "3518800", // Guarulhos
  "3522208", // Itapecerica da Serra
  "3522505", // Itapevi
  "3523107", // Itaquaquecetuba
  "3525003", // Jandira
  "3526209", // Juquitiba
  "3528502", // Mairiporã
  "3529401", // Mauá
  "3530607", // Mogi das Cruzes
  "3534401", // Osasco
  "3539103", // Pirapora do Bom Jesus
  "3539806", // Poá
  "3543303", // Ribeirão Pires
  "3544103", // Rio Grande da Serra
  "3545001", // Salesópolis
  "3546801", // Santa Isabel
  "3547304", // Santana de Parnaíba
  "3547809", // Santo André
  "3548708", // São Bernardo do Campo
  "3548807", // São Caetano do Sul
  "3549953", // São Lourenço da Serra
  "3550308", // São Paulo
  "3552502", // Suzano
  "3552809", // Taboão da Serra
  "3556453", // Vargem Grande Paulista
]);

export type CepInfo = {
  cep: string; // só dígitos
  street: string; // vazio em cidades de CEP único: a pessoa digita
  neighborhood: string;
  city: string;
  state: string;
  inArea: boolean;
};

// null: CEP inexistente. Lança erro se o ViaCEP não responder.
export async function lookupCep(raw: string): Promise<CepInfo | null> {
  const cep = raw.replace(/\D/g, "");
  if (cep.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(6000) });
  if (res.status === 400) return null;
  if (!res.ok) throw new Error(`ViaCEP: HTTP ${res.status}`);
  const data = (await res.json()) as {
    erro?: unknown;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    ibge?: string;
  };
  if (data.erro || !data.localidade) return null;
  return {
    cep,
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade,
    state: data.uf ?? "",
    inArea: GRANDE_SP.has(data.ibge ?? ""),
  };
}
