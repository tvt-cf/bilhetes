# bilhetes · Oráculo

Site do Oráculo (“um ritual para viver maior”) e painel interno para a comunidade no WhatsApp.

- `/` — home: produto, manifesto, ritual, compra online (“Eu quero”) ou fila de espera quando esgota, e cadastro no movimento
- `/manifesto` — manifesto completo
- `/admin` — comunidade: cadastrados, fila de espera, pré-venda, compradores, descadastrados, busca, exportação CSV e o botão de esgotado
- `/admin/pedidos` — pedidos e pagamentos da InfinitePay
- `/admin/mensagens` — mensagens pelo WhatsApp (agora ou agendadas) e histórico de entregas, leituras e respostas

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha ADMIN_PASSWORD e SESSION_SECRET
npm run dev
```

Sem `DATABASE_URL`, o projeto sobe um Postgres embutido (PGlite) em `.data/`. Em `npm run dev` a senha
padrão do admin é `bilhetes`; em produção ela é obrigatória via `ADMIN_PASSWORD`.

Textos que mudam com frequência (preço, tiragem, frete) ficam em `lib/site.ts`.
O manifesto fica em `lib/manifesto.ts`.

## Publicar (Vercel)

1. Importe o repositório na Vercel.
2. Crie um Postgres (Neon pelo Marketplace da Vercel, ou Supabase) e coloque a URL em `DATABASE_URL`.
   As tabelas são criadas sozinhas no primeiro acesso.
3. Configure as variáveis do `.env.example` (no mínimo `ADMIN_PASSWORD`, `SESSION_SECRET`, `CRON_SECRET`).
4. O `vercel.json` agenda `/api/cron/dispatch` todo dia às 10h UTC (7h de Brasília) para soltar as mensagens agendadas.

## WhatsApp (Cloud API da Meta)

Enquanto `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` não estiverem configurados, o painel funciona em
**modo simulação**: as mensagens são registradas, mas nada sai.

Para enviar de verdade:

1. Crie o app na Meta for Developers com o produto WhatsApp e um número verificado da bilhetes.
2. Gere um token permanente (usuário do sistema) → `WHATSAPP_TOKEN`; copie o ID do número → `WHATSAPP_PHONE_NUMBER_ID`.
3. Aprove quatro templates (Marketing para sabedoria, evento e novo lote; Utilidade para pedido), cada um com
   uma variável `{{1}}` no corpo, e um botão de resposta rápida “Parar de receber”. Ponha os nomes em
   `WHATSAPP_TEMPLATE_SABEDORIA`, `WHATSAPP_TEMPLATE_EVENTO`, `WHATSAPP_TEMPLATE_PEDIDO` e `WHATSAPP_TEMPLATE_LOTE`.
4. Webhook: URL `https://SEU-DOMINIO/api/whatsapp/webhook`, token de verificação = `WHATSAPP_VERIFY_TOKEN`,
   assine o campo `messages`. Preencha `WHATSAPP_APP_SECRET` para validar a assinatura.

O webhook atualiza entregue/lido/falhou, conta respostas e descadastra quem responder “sair”, “parar” ou
tocar em “Parar de receber”. A Meta não aceita quebras de linha dentro da variável do template; o painel
junta as linhas automaticamente.

## Estoque e fila de espera

A edição esgota sozinha quando o número de compras chega à tiragem (`produto.tiragem`), ou na hora em que
alguém clica em “Marcar como esgotado” em `/admin`. Esgotado, o site troca “Eu quero” por “Entrar na fila de
espera”. Para avisar o próximo lote, crie uma mensagem do tipo “Aviso de novo lote”: ele já seleciona a fila.

## Pagamento

“Eu quero” guarda nome, WhatsApp e a forma de pagamento e, com `INFINITEPAY_HANDLE` configurado, leva direto
para o checkout da InfinitePay (R$ 499 à vista ou R$ 599 parcelado, valores em `produto.precoCentavos`).
Quando a InfinitePay avisa o pagamento em `/api/infinitepay/webhook`, o site confere em `/payment_check` e
marca a pessoa como “Comprou”. O número da caixa continua sendo dado em `/admin`.

Sem `INFINITEPAY_HANDLE`, o pedido fica registrado como pré-venda e o pagamento é combinado pelo WhatsApp;
nesse caso, marque “Pagou” com o número do pedido na tela Comunidade.
