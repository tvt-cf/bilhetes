# bilhetes · Oráculo

Site do Oráculo (“um ritual para viver maior”) e painel interno para a comunidade no WhatsApp.

- `/` — home: produto, manifesto, ritual, pré-venda, lançamento (RSVP via lu.ma) e cadastro no movimento
- `/manifesto` — manifesto completo
- `/admin` — comunidade: cadastrados, pré-venda, compradores, descadastrados, busca e exportação CSV
- `/admin/envios` — mensagens pelo WhatsApp (agora ou agendadas) e histórico de entregas, leituras e respostas

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha ADMIN_PASSWORD e SESSION_SECRET
npm run dev
```

Sem `DATABASE_URL`, o projeto sobe um Postgres embutido (PGlite) em `.data/`. Em `npm run dev` a senha
padrão do admin é `bilhetes`; em produção ela é obrigatória via `ADMIN_PASSWORD`.

Textos que mudam com frequência (preço, data e local do lançamento, link do lu.ma) ficam em `lib/site.ts`.
O manifesto fica em `lib/manifesto.ts`.

## Publicar (Vercel)

1. Importe o repositório na Vercel.
2. Crie um Postgres (Neon pelo Marketplace da Vercel, ou Supabase) e coloque a URL em `DATABASE_URL`.
   As tabelas são criadas sozinhas no primeiro acesso.
3. Configure as variáveis do `.env.example` (no mínimo `ADMIN_PASSWORD`, `SESSION_SECRET`, `CRON_SECRET`).
4. O `vercel.json` agenda `/api/cron/dispatch` todo dia às 10h UTC (7h de Brasília) para soltar os envios agendados.

## WhatsApp (Cloud API da Meta)

Enquanto `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` não estiverem configurados, o painel funciona em
**modo simulação**: os envios são registrados, mas nada sai.

Para enviar de verdade:

1. Crie o app na Meta for Developers com o produto WhatsApp e um número verificado da bilhetes.
2. Gere um token permanente (usuário do sistema) → `WHATSAPP_TOKEN`; copie o ID do número → `WHATSAPP_PHONE_NUMBER_ID`.
3. Aprove três templates (categoria Marketing para sabedoria e evento, Utilidade para pedido), cada um com
   uma variável `{{1}}` no corpo, e um botão de resposta rápida “Parar de receber”. Ponha os nomes em
   `WHATSAPP_TEMPLATE_SABEDORIA`, `WHATSAPP_TEMPLATE_EVENTO` e `WHATSAPP_TEMPLATE_PEDIDO`.
4. Webhook: URL `https://SEU-DOMINIO/api/whatsapp/webhook`, token de verificação = `WHATSAPP_VERIFY_TOKEN`,
   assine o campo `messages`. Preencha `WHATSAPP_APP_SECRET` para validar a assinatura.

O webhook atualiza entregue/lido/falhou, conta respostas e descadastra quem responder “sair”, “parar” ou
tocar em “Parar de receber”. A Meta não aceita quebras de linha dentro da variável do template; o painel
junta as linhas automaticamente.

## Pagamento

A pré-venda guarda nome, WhatsApp e a preferência (à vista ou parcelado). Quando o pagamento é confirmado,
marque “Pagou” com o número do pedido na tela Comunidade. A integração com um checkout ainda não foi feita.
