// Cria a preferência de pagamento no Mercado Pago (Checkout Pro).
// Preço e estoque são conferidos aqui, no banco — nunca confiamos no que vem do navegador.
// Secrets: MP_ACCESS_TOKEN, SITE_URL (ex.: https://morenapratas.com.br)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

  const { items, email } = (await req.json()) as { items: { sku: string; qty: number }[]; email?: string };
  if (!Array.isArray(items) || !items.length || items.length > 30) return json({ error: "Sacola vazia" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // quem está logada (opcional): o pedido fica ligado à conta
  let userId: string | null = null;
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (jwt) {
    const { data } = await db.auth.getUser(jwt);
    userId = data.user?.id ?? null;
  }

  const { data: variants, error } = await db.from("variants").select("sku, size, price, stock, products(name, active)").in("sku", items.map((i) => i.sku));
  if (error) return json({ error: "Falha ao conferir o estoque" }, 500);

  const lines = [];
  for (const it of items) {
    const v = variants?.find((x: any) => x.sku === it.sku) as any;
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    if (!v || !v.products?.active || v.stock < qty) return json({ error: `Sem estoque suficiente: ${it.sku}` }, 409);
    lines.push({ sku: v.sku, name: v.products.name, size: v.size, qty, price: Number(v.price) });
  }
  const total = lines.reduce((n, l) => n + l.qty * l.price, 0);

  const { data: order, error: oe } = await db.from("orders").insert({ user_id: userId, email, total, items: lines }).select("id").single();
  if (oe) return json({ error: "Falha ao criar o pedido" }, 500);

  const site = Deno.env.get("SITE_URL")!;
  const fnBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
  const pref = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`, "content-type": "application/json", "x-idempotency-key": order.id },
    body: JSON.stringify({
      items: lines.map((l) => ({ id: l.sku, title: `${l.name}${l.size !== "Único" ? ` (${l.size})` : ""}`, quantity: l.qty, unit_price: l.price, currency_id: "BRL" })),
      payer: email ? { email } : undefined,
      external_reference: order.id,
      back_urls: { success: `${site}/pedido/retorno`, pending: `${site}/pedido/retorno`, failure: `${site}/pedido/retorno` },
      auto_return: "approved",
      notification_url: `${fnBase}/mp-webhook`,
      statement_descriptor: "MORENA PRATAS",
    }),
  });
  if (!pref.ok) return json({ error: "Mercado Pago indisponível" }, 502);
  const p = await pref.json();
  await db.from("orders").update({ mp_preference_id: p.id }).eq("id", order.id);

  return json({ url: p.init_point, orderId: order.id });
});
