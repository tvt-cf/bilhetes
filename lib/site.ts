// Dados editáveis do produto. Tudo que aparece no site e muda com frequência fica aqui.

export const produto = {
  nome: "Bilhetes",
  slogan: "Seu Ritual para Viver Maior.",
  edicao: "Edição Nº 01",
  tiragem: 100,
  bilhetes: 22,
  preco: "R$ 599",
  parcelamento: "em até 10x de R$ 59,90",
  parcelas: "10x de R$ 59,90",
  precoAVista: "R$ 499 à vista",
  // valores do checkout da InfinitePay, em centavos (manter em sincronia com os textos acima):
  // a_vista é o preço no Pix, parcelado é o preço no cartão
  precoCentavos: { a_vista: 49900, parcelado: 59900 },
  frete: "Frete incluso para todo o Brasil",
};

export const instagram = "https://instagram.com/bilhetes.co";
