// Dados editáveis do lançamento e do produto. Tudo que aparece no site e muda com frequência fica aqui.

export const produto = {
  nome: "Oráculo",
  slogan: "Um ritual para viver maior.",
  edicao: "Edição Nº 01",
  tiragem: 300,
  bilhetes: 22,
  preco: "R$ 599",
  parcelamento: "em até 10x de R$ 59,90",
  precoAVista: "R$ 499 à vista",
  frete: "Frete incluso para todo o Brasil",
};

export const lancamento = {
  data: "Domingo, 15 nov",
  dataCurta: "15/11",
  horario: "9h às 12h",
  local: "Casa da Gá",
  endereco: "R. Antônio de Gouveia Giudice, 999",
  vagas: 15,
  anfitrias: "Gabriela & Julia",
  programacao: [
    ["9h", "Um café para começar"],
    ["10h", "Yoga & Meditação com Fabi Barbosa"],
    ["11h", "Ritual de lançamento dos Bilhetes"],
  ] as const,
  lumaUrl: process.env.NEXT_PUBLIC_LUMA_URL ?? "https://lu.ma/bilhetes",
};

export const instagram = "https://instagram.com/bilhetes.co";
