#!/usr/bin/env node
// Sincroniza o estoque da planilha do Drive com o site.
//
// Uso:
//   GOOGLE_SERVICE_ACCOUNT_JSON='{...}' SHEET_ID=xxx node scripts/sync-catalog.mjs
//   node scripts/sync-catalog.mjs --file data/estoque-snapshot.json   (linhas já baixadas)
//
// A planilha continua privada: ela é compartilhada (somente leitura) com o e-mail da conta de serviço.
// Gera public/catalog.json apenas com SKU, nome, tamanho, preço e saldo. Custo e fornecedor nunca saem da planilha.

import { createSign } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { rowsToCatalog } from "../supabase/functions/_shared/catalog-core.mjs";

const SHEET_ID = process.env.SHEET_ID;
const RANGE = process.env.SHEET_RANGE || "Estoque!A1:Z2000";
const OUT = process.env.CATALOG_OUT || "public/catalog.json";

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${head}.${claim}`);
  const jwt = `${head}.${claim}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Token Google falhou: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function fetchRows() {
  const fileArg = process.argv.indexOf("--file");
  if (fileArg > 0) return JSON.parse(await readFile(process.argv[fileArg + 1], "utf8"));
  if (!SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("Defina SHEET_ID e GOOGLE_SERVICE_ACCOUNT_JSON (ou use --file).");
  }
  const token = await accessToken(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON));
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?valueRenderOption=UNFORMATTED_VALUE`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Leitura da planilha falhou: ${res.status} ${await res.text()}`);
  return (await res.json()).values;
}

const rows = await fetchRows();
const { products, hidden } = rowsToCatalog(rows);
const catalog = { updatedAt: new Date().toISOString(), products };
await writeFile(OUT, JSON.stringify(catalog, null, 2) + "\n");

console.log(`Catálogo: ${products.length} peças (${products.reduce((n, p) => n + p.variants.length, 0)} variações) → ${OUT}`);
if (hidden.length) {
  console.log(`\nFora do site (${hidden.length}):`);
  for (const h of hidden) console.log(`  ${h.sku.padEnd(22)} ${h.motivo.padEnd(28)} ${h.name}`);
}
