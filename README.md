# Morena Pratas — loja online

Loja de joias em prata 925 e banho de ouro 18k. Anéis, aparadores, colares, pulseiras, brincos e tornozeleiras, com estoque vindo direto da planilha do Drive.

**Stack igual à do Lovable:** React + Vite + TypeScript + Tailwind + Supabase. O projeto roda hoje no GitHub Pages e pode ser levado ao Lovable sem reescrever nada.

## Como está montado

| Parte | Como funciona |
| --- | --- |
| Catálogo | `public/catalog.json`, gerado da aba **Estoque** do "Painel Morena Pratas" |
| Estoque | GitHub Action relê a planilha a cada 30 min e republica o site. No Supabase, a função `sync-estoque` faz o mesmo a cada 15 min |
| Login | Código de 6 dígitos no e-mail (Supabase Auth, sem senha) |
| Pagamento | Mercado Pago Checkout Pro: Pix, cartão e boleto na página deles. O site nunca vê dados de cartão |
| Pedido pago | Webhook confirma na API do Mercado Pago, baixa o estoque e lança a venda na aba **Pedidos** |
| Modo prévia | Sem Supabase configurado: login com o código `123456` e pedido fechado pelo WhatsApp |

### Regras da planilha → site

- Categoria pelo prefixo do SKU: `AN` anéis, `CO` colares, `PU` pulseiras, `BR` brincos, `TO` tornozeleiras. Anel com "Aparador" no nome vai para **Aparadores**.
- Banhada a ouro: `OURO` no SKU ou "Banho de Ouro" no nome.
- Tamanhos da mesma peça se juntam pelo SKU base (`AN-P925-LIS-002-14` e `-18` viram uma peça com aros 14 e 18).
- Fica **fora** do site: peça sem preço de venda, com saldo zero ou negativo, ou com "Ativo no site" = Não.
- Custo, fornecedor e datas **nunca** saem da planilha.
- Colunas opcionais que o site já entende: **Foto (URL)**, **Descrição**, **Ativo no site**.

## Fotos

Enquanto a loja não tem fotos próprias, cada peça usa a foto do Unsplash mais parecida com a descrição (licença Unsplash: uso comercial livre). A escolha fica em `data/fotos.json` (por SKU e, na falta, por tipo de peça) e a origem de cada foto em `data/creditos-fotos.json`. A página da peça avisa "Foto ilustrativa".

Quando a coluna **Foto (URL)** da planilha estiver preenchida, a foto da planilha passa na frente automaticamente.

## Rodar no computador

```bash
npm install
npm run dev
# atualizar o catálogo a partir de linhas salvas:
node scripts/sync-catalog.mjs --file data/estoque-snapshot.json
```

## Ligar a sincronização com a planilha (GitHub)

1. No Google Cloud, crie uma **conta de serviço** e baixe a chave JSON.
2. Compartilhe a planilha "Painel Morena Pratas" com o e-mail da conta de serviço como **Leitor**.
3. Em *Settings → Secrets and variables → Actions*, cadastre `SHEET_ID` e `GOOGLE_SERVICE_ACCOUNT_JSON`.
4. Em *Variables*, cadastre `VITE_WHATSAPP` com o número da loja (ex.: `5511987654321`).

## Ligar login, pagamento e pedidos (Supabase / Lovable Cloud)

1. Rode `supabase/migrations/0001_loja.sql` no SQL Editor.
2. **Authentication → Email Templates → Magic Link**: troque o link por `{{ .Token }}` para o e-mail mandar o código de 6 dígitos.
3. Publique as funções `sync-estoque`, `create-checkout` e `mp-webhook` (pasta `supabase/functions`).
4. Secrets das funções: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `SITE_URL`, `SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` (a conta de serviço precisa ser **Editor** para lançar pedidos).
5. No Mercado Pago (*Suas integrações → Webhooks*), aponte para `https://<projeto>.supabase.co/functions/v1/mp-webhook`, evento **Pagamentos**.
6. Ative `pg_cron` e `pg_net` e rode o bloco comentado no fim da migration.
7. Coloque `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis do build.

## Levar para o Lovable

O Lovable cria o próprio repositório ao conectar o GitHub. O caminho mais limpo:

1. Crie um projeto vazio no Lovable e conecte ao GitHub (ele cria um repo novo).
2. Copie o conteúdo deste repositório para o repo do Lovable e faça push. O Lovable sincroniza sozinho.
3. Ative o Lovable Cloud e siga a seção do Supabase acima.

## Antes de publicar de verdade

- [ ] WhatsApp real da loja (`VITE_WHATSAPP`)
- [ ] Fotos das peças na coluna **Foto (URL)** — hoje cada peça usa uma foto ilustrativa do Unsplash (marcada como ilustrativa na página da peça)
- [ ] Preço de venda nas peças sem preço e quantidade comprada nas peças com saldo negativo
- [ ] Confirmar textos de exemplo: embalagem para presente inclusa, retirada em Salto sem custo, assinatura da carta
