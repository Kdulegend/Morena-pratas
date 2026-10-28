// Lê a aba Estoque da planilha e atualiza products/variants.
// Disparada pelo pg_cron a cada 15 min (ver migration) ou manualmente.
import { createClient } from "npm:@supabase/supabase-js@2";
import { googleToken, readRange } from "../_shared/google.ts";
// @ts-ignore módulo JS compartilhado com o script Node
import { rowsToCatalog } from "../_shared/catalog-core.mjs";

Deno.serve(async (req) => {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) return new Response("não autorizado", { status: 401 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = await googleToken("https://www.googleapis.com/auth/spreadsheets.readonly");
  const rows = await readRange(Deno.env.get("SHEET_RANGE") ?? "Estoque!A1:Z2000", token);
  const { products, hidden } = rowsToCatalog(rows);

  const now = new Date().toISOString();
  const { error: e1 } = await db.from("products").upsert(
    products.map((p: any) => ({ id: p.id, slug: p.slug, name: p.name, category: p.category, material: p.material, description: p.description, photo: p.photo, drawing: p.drawing, active: true, updated_at: now })),
  );
  if (e1) return Response.json({ error: e1.message }, { status: 500 });

  const variants = products.flatMap((p: any) => p.variants.map((v: any) => ({ sku: v.sku, product_id: p.id, size: v.size, price: v.price, stock: v.stock, updated_at: now })));
  const { error: e2 } = await db.from("variants").upsert(variants);
  if (e2) return Response.json({ error: e2.message }, { status: 500 });

  // O que saiu da planilha (ou ficou sem preço/saldo) deixa de aparecer: estoque zerado e peça inativa
  const liveSkus = variants.map((v: any) => v.sku);
  await db.from("variants").update({ stock: 0, updated_at: now }).not("sku", "in", `(${liveSkus.map((s: string) => `"${s}"`).join(",")})`);
  await db.from("products").update({ active: false, updated_at: now }).not("id", "in", `(${products.map((p: any) => `"${p.id}"`).join(",")})`);

  return Response.json({ ok: true, products: products.length, variants: variants.length, hidden });
});
